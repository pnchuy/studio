"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { generateId, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface CommentSectionProps {
  bookId: string;
}

const COMMENTS_STORAGE_KEY_PREFIX = 'bibliophile-comments-';

export function CommentSection({ bookId }: CommentSectionProps) {
  const { user, isLoggedIn } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedComments = localStorage.getItem(`${COMMENTS_STORAGE_KEY_PREFIX}${bookId}`);
      if (storedComments) {
        setComments(JSON.parse(storedComments));
      }
    } catch (error) {
      console.error("Could not read comments from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  const persistComments = (updatedComments: Comment[]) => {
    try {
      localStorage.setItem(`${COMMENTS_STORAGE_KEY_PREFIX}${bookId}`, JSON.stringify(updatedComments));
      setComments(updatedComments);
    } catch (error) {
       console.error("Could not save comments to localStorage", error);
    }
  };

  const handlePostComment = () => {
    if (!user || !newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${generateId()}`,
      bookId,
      userId: user.id,
      userName: user.name,
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [comment, ...comments];
    persistComments(updatedComments);
    setNewComment('');
  };

  if (isLoading) {
      return null;
  }

  return (
    <div className="mt-12">
        <h2 className="text-2xl font-bold font-headline mb-4">Comments ({comments.length})</h2>
        <Card>
            <CardContent className="p-6">
                {!isLoggedIn ? (
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-8">
                        <p className="font-medium">Want to join the discussion?</p>
                        <p className="text-sm mt-1">
                            <Link href="/login" className="text-primary underline hover:text-primary/80">Login</Link> or{' '}
                            <Link href="/signup" className="text-primary underline hover:text-primary/80">Sign up</Link> to post a comment.
                        </p>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <Avatar>
                            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="w-full space-y-2">
                           <Textarea
                                placeholder="Write a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={3}
                            />
                            <div className="flex justify-end">
                                <Button onClick={handlePostComment} disabled={!newComment.trim()}>Post Comment</Button>
                            </div>
                        </div>
                    </div>
                )}
                
                {comments.length > 0 && (
                    <>
                        <Separator className="my-6" />
                        <div className="space-y-6">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4">
                                    <Avatar>
                                        <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{comment.userName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
