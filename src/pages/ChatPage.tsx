import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, User, Store, MessageSquare, ChevronLeft, Info, MoreVertical, Zap, Check, CheckCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../features/auth/stores/authStore';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { format } from 'date-fns';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
    status: 'sent' | 'delivered' | 'seen';
}

interface Conversation {
    other_user_id: string;
    other_user_name: string;
    other_user_role: string;
    other_user_avatar?: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

export default function ChatPage() {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingConvs, setIsLoadingConvs] = useState(true);
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Conversations
    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            setIsLoadingConvs(true);
            // This is a complex query, we'll use a RPC or a clever join
            // For now, let's get unique sender/receivers we've interacted with
            const { data, error } = await supabase
                .from('chat_messages')
                .select('sender_id, receiver_id, content, created_at, is_read')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching conversations:", error);
                setIsLoadingConvs(false);
                return;
            }

            // Group by other user
            const grouped: Record<string, any> = {};
            data?.forEach(msg => {
                const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                if (!grouped[otherId]) {
                    grouped[otherId] = {
                        other_user_id: otherId,
                        last_message: msg.content,
                        last_message_at: msg.created_at,
                        unread_count: (msg.receiver_id === user.id && !msg.is_read) ? 1 : 0
                    };
                } else if (msg.receiver_id === user.id && !msg.is_read) {
                    grouped[otherId].unread_count += 1;
                }
            });

            // Fetch user profiles for these IDs (refined role-based avatars)
            const otherIds = Object.keys(grouped);
            if (otherIds.length > 0) {
                const { data: userData } = await supabase.rpc('get_user_chat_profiles', { p_user_ids: otherIds });
                userData?.forEach((u: any) => {
                    if (grouped[u.id]) {
                        grouped[u.id].other_user_name = u.name;
                        grouped[u.id].other_user_role = u.role;
                        grouped[u.id].other_user_avatar = u.avatar_url;
                    }
                });
            }

            setConversations(Object.values(grouped).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));
            setIsLoadingConvs(false);
        };

        fetchConversations();

        // Subscribe to new messages globally to update conversation list
        const channel = supabase.channel('conversation_updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    // 2. Fetch Messages for selected conversation
    useEffect(() => {
        if (!user || !selectedUserId) return;

        const fetchMessages = async () => {
            setIsLoadingMsgs(true);
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true });

            if (!error) {
                setMessages(data || [] as any);
                // Mark as seen
                await supabase.from('chat_messages')
                    .update({ is_read: true, status: 'seen' })
                    .eq('receiver_id', user.id)
                    .eq('sender_id', selectedUserId);
            }
            setIsLoadingMsgs(false);
        };

        fetchMessages();

        // Subscribe to messages in this specific room
        const channel = supabase.channel(`room_${selectedUserId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
                const msg = payload.new as Message;
                if ((msg.sender_id === user.id && msg.receiver_id === selectedUserId) || 
                    (msg.sender_id === selectedUserId && msg.receiver_id === user.id)) {
                    setMessages(prev => [...prev, msg]);
                    
                    // Signal "seen" if we are currently looking at this chat
                    if (msg.receiver_id === user.id && msg.status !== 'seen') {
                        supabase.from('chat_messages').update({ is_read: true, status: 'seen' }).eq('id', msg.id).then();
                    }
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
                const updatedMsg = payload.new as Message;
                setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, selectedUserId]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedUserId || !newMessage.trim()) return;

        const msgToSend = newMessage;
        setNewMessage('');

        const { error } = await supabase.from('chat_messages').insert({
            sender_id: user.id,
            receiver_id: selectedUserId,
            content: msgToSend,
            status: 'sent'
        });

        if (error) {
            console.error("Error sending message:", error);
        }
    };

    const activeChat = conversations.find(c => c.other_user_id === selectedUserId);

    return (
        <div className="container mx-auto px-4 md:px-8 py-6 h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            
            {/* Conversations Sidebar */}
            <div className={`flex-col md:w-80 lg:w-96 bg-card border rounded-[2rem] shadow-sm overflow-hidden flex ${selectedUserId ? 'hidden md:flex' : 'flex w-full'}`}>
                <div className="p-6 border-b space-y-4">
                    <h1 className="text-2xl font-black">Messages</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search chats..." 
                            className="w-full bg-secondary/50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 ring-accent/20 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoadingConvs ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 flex gap-3 animate-pulse">
                                <Skeleton className="w-12 h-12 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            </div>
                        ))
                    ) : conversations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <MessageSquare size={48} className="mb-4 opacity-20" />
                            <p className="font-bold">No messages yet</p>
                            <p className="text-xs">Start a conversation from a product page!</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <motion.div 
                                key={conv.other_user_id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedUserId(conv.other_user_id)}
                                className={`p-4 rounded-2xl flex gap-3 cursor-pointer transition-all hover:bg-secondary/50 ${selectedUserId === conv.other_user_id ? 'bg-accent/5 border border-accent/20' : 'border border-transparent'}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden border">
                                    {conv.other_user_avatar ? (
                                        <img src={conv.other_user_avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        conv.other_user_name?.charAt(0) || 'U'
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h3 className="font-bold truncate pr-2">{conv.other_user_name}</h3>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{format(new Date(conv.last_message_at), 'HH:mm')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-muted-foreground truncate font-medium">{conv.last_message}</p>
                                        {conv.unread_count > 0 && (
                                            <span className="w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-black">{conv.unread_count}</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 bg-card border rounded-[2rem] shadow-sm overflow-hidden flex flex-col ${!selectedUserId ? 'hidden md:flex items-center justify-center text-muted-foreground' : 'flex'}`}>
                {selectedUserId ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b flex items-center justify-between bg-background/50 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" onClick={() => setSelectedUserId(null)} className="md:hidden rounded-full">
                                    <ChevronLeft />
                                </Button>
                                <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold overflow-hidden border">
                                    {activeChat?.other_user_avatar ? (
                                        <img src={activeChat.other_user_avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        activeChat?.other_user_name?.charAt(0) || 'U'
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-bold leading-tight">{activeChat?.other_user_name}</h2>
                                    <p className="text-[10px] text-accent font-black uppercase tracking-widest">{activeChat?.other_user_role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="rounded-full"><Info size={20} /></Button>
                                <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical size={20} /></Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-4 bg-dot-pattern scroll-smooth"
                        >
                            {isLoadingMsgs ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                     <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Encrypting Chat...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4">
                                    <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground">
                                        <Zap size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-muted-foreground">No message history. Say Hi!</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div 
                                        key={msg.id} 
                                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[75%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
                                            msg.sender_id === user?.id 
                                                ? 'bg-accent text-white rounded-br-none' 
                                                : 'bg-secondary text-foreground rounded-bl-none'
                                        }`}>
                                            {msg.content}
                                            <div className="flex items-center justify-end gap-1 mt-1 font-black uppercase tracking-widest opacity-60">
                                                <p className={`text-[9px] ${msg.sender_id === user?.id ? 'text-white' : 'text-muted-foreground'}`}>
                                                    {format(new Date(msg.created_at), 'HH:mm')}
                                                </p>
                                                {msg.sender_id === user?.id && (
                                                    <div className="flex items-center">
                                                        {msg.status === 'sent' && <Check size={10} className="text-white/70" />}
                                                        {msg.status === 'delivered' && <CheckCheck size={10} className="text-white/70" />}
                                                        {msg.status === 'seen' && <CheckCheck size={10} className="text-blue-300" />}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-background/50 border-t flex gap-3">
                            <input 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                type="text" 
                                placeholder="Type your message..." 
                                className="flex-1 bg-secondary rounded-2xl px-6 py-3 text-sm font-bold outline-none focus:ring-2 ring-accent/20 transition-all border border-transparent focus:border-accent/40"
                            />
                            <Button type="submit" variant="accent" size="icon" className="w-12 h-12 rounded-2xl shadow-lg shadow-accent/20 shrink-0">
                                <Send size={20} />
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-6 p-8 opacity-40">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-secondary flex items-center justify-center">
                            <MessageSquare size={48} />
                        </div>
                        <div className="text-center space-y-2">
                             <h3 className="text-xl font-black">Your Secure Workspace</h3>
                             <p className="text-sm font-medium max-w-xs">Select a conversation to start chatting with verified vendors or customers.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
