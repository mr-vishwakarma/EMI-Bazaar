import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, Loader2, MessageCircle, User } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { reviewsApi } from '../api/reviewsApi';
import type { Review, ProductRating } from '../api/reviewsApi';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface ProductReviewsProps {
    productId: string;
    onRatingLoaded?: (rating: ProductRating) => void;
}

function StarRating({ rating, size = 18, interactive = false, onChange }: {
    rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void;
}) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => interactive && setHover(star)}
                    onMouseLeave={() => interactive && setHover(0)}
                    className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                >
                    <Star
                        size={size}
                        fill={(hover || rating) >= star ? '#facc15' : 'transparent'}
                        className={(hover || rating) >= star ? 'text-yellow-400' : 'text-muted-foreground/30'}
                        strokeWidth={2}
                    />
                </button>
            ))}
        </div>
    );
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-8 text-right font-bold text-muted-foreground">{stars}★</span>
            <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: (5 - stars) * 0.1 }}
                    className="h-full bg-yellow-400 rounded-full"
                />
            </div>
            <span className="w-8 text-xs font-bold text-muted-foreground">{count}</span>
        </div>
    );
}

export default function ProductReviews({ productId, onRatingLoaded }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [ratingData, setRatingData] = useState<ProductRating>({ avgRating: 0, reviewCount: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [reviewsList, rating] = await Promise.all([
                reviewsApi.getProductReviews(productId),
                reviewsApi.getProductRating(productId),
            ]);
            setReviews(reviewsList);
            setRatingData(rating);
            onRatingLoaded?.(rating);

            const { data: { user } } = await supabase.auth.getUser();
            setIsLoggedIn(!!user);
            setLoading(false);
        };
        load();
    }, [productId]);

    const handleSubmit = async () => {
        if (newRating === 0) {
            toast.error('Please select a star rating');
            return;
        }
        setSubmitting(true);
        const ok = await reviewsApi.submitReview(productId, newRating, newComment);
        if (ok) {
            toast.success('Review submitted! Thank you 🎉');
            setNewRating(0);
            setNewComment('');
            setShowForm(false);
            // Refresh
            const [reviewsList, rating] = await Promise.all([
                reviewsApi.getProductReviews(productId),
                reviewsApi.getProductRating(productId),
            ]);
            setReviews(reviewsList);
            setRatingData(rating);
            onRatingLoaded?.(rating);
        } else {
            toast.error('Failed to submit review. You may need to log in.');
        }
        setSubmitting(false);
    };

    // Calculate distribution
    const dist = [5, 4, 3, 2, 1].map(s => ({
        stars: s,
        count: reviews.filter(r => r.rating === s).length,
    }));

    if (loading) {
        return (
            <div className="mt-10 pt-10 border-t border-border/50 animate-pulse space-y-6">
                <div className="h-8 w-48 bg-secondary rounded-xl" />
                <div className="flex gap-8">
                    <div className="h-32 w-40 bg-secondary rounded-2xl" />
                    <div className="flex-1 space-y-3">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-3 bg-secondary rounded-full" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 pt-10 border-t border-border/50"
        >
            <h3 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-2">
                <MessageCircle size={24} className="text-accent" /> Customer Reviews
            </h3>

            <div className="flex flex-col md:flex-row gap-8 mb-8">
                {/* Rating Summary */}
                <div className="flex flex-col items-center justify-center bg-card border rounded-3xl p-8 min-w-[180px]">
                    <p className="text-5xl font-black tracking-tighter">{ratingData.avgRating || '—'}</p>
                    <StarRating rating={Math.round(ratingData.avgRating)} size={20} />
                    <p className="text-sm text-muted-foreground font-medium mt-2">
                        {ratingData.reviewCount} Review{ratingData.reviewCount !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Distribution */}
                <div className="flex-1 space-y-2.5 justify-center flex flex-col">
                    {dist.map(d => (
                        <RatingBar key={d.stars} stars={d.stars} count={d.count} total={reviews.length} />
                    ))}
                </div>
            </div>

            {/* Write Review */}
            {isLoggedIn && (
                <div className="mb-8">
                    {!showForm ? (
                        <Button
                            onClick={() => setShowForm(true)}
                            variant="outline"
                            className="rounded-xl border-2 font-bold gap-2"
                        >
                            <Star size={16} /> Write a Review
                        </Button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-card border rounded-2xl p-6 space-y-4"
                        >
                            <div>
                                <p className="text-sm font-bold mb-2">Your Rating</p>
                                <StarRating rating={newRating} size={28} interactive onChange={setNewRating} />
                            </div>
                            <div>
                                <p className="text-sm font-bold mb-2">Your Review (optional)</p>
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Share your experience with this product..."
                                    className="w-full h-24 bg-secondary/50 border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting || newRating === 0}
                                    variant="accent"
                                    className="rounded-xl font-bold gap-2 shadow-lg shadow-accent/20"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    {submitting ? 'Posting...' : 'Submit Review'}
                                </Button>
                                <Button onClick={() => setShowForm(false)} variant="ghost" className="rounded-xl">
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Review List */}
            {reviews.length === 0 ? (
                <div className="text-center py-12 bg-secondary/20 rounded-3xl border-2 border-dashed">
                    <Star size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-bold">No reviews yet</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Be the first to review this product!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {reviews.map((review, idx) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-card border rounded-2xl p-5 flex gap-4"
                            >
                                <div className="w-10 h-10 bg-accent/10 text-accent rounded-full flex items-center justify-center shrink-0 font-black text-sm">
                                    {review.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="font-bold text-sm truncate">{review.customer_name}</span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <StarRating rating={review.rating} size={14} />
                                    {review.comment && (
                                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}
