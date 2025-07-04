"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { ThumbsUp, ThumbsDown, MessageSquareReply } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  bookId: string;
}

const COMMENTS_STORAGE_KEY_PREFIX = 'bibliophile-comments-';

type CommentWithChildren = Comment & { children: CommentWithChildren[] };

export function CommentSection({ bookId }: CommentSectionProps) {
  const { user, isLoggedIn } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedComments = localStorage.getItem(`${COMMENTS_STORAGE_KEY_PREFIX}${bookId}`);
      if (storedComments) {
        const parsedComments: Comment[] = JSON.parse(storedComments);
        const patchedComments = parsedComments.map(c => ({
            ...c,
            likes: c.likes ?? [],
            dislikes: c.dislikes ?? [],
            parentId: c.parentId ?? null,
        }));
        setComments(patchedComments);
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

  const handlePostComment = (text: string, parentId: string | null) => {
    if (!user || !text.trim()) return;

    const comment: Comment = {
      id: `comment-${generateId()}`,
      bookId,
      userId: user.id,
      userName: user.name,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      likes: [],
      dislikes: [],
      parentId,
    };

    const updatedComments = [comment, ...comments];
    persistComments(updatedComments);
    if (parentId) {
      setReplyingTo(null);
    } else {
      setNewComment('');
    }
  };

  const handleVote = (commentId: string, voteType: 'like' | 'dislike') => {
    if (!user) return;
    const updatedComments = comments.map(c => {
      if (c.id === commentId) {
        const likes = new Set(c.likes);
        const dislikes = new Set(c.dislikes);
        const userId = user.id;

        if (voteType === 'like') {
          if (likes.has(userId)) {
            likes.delete(userId);
          } else {
            likes.add(userId);
            dislikes.delete(userId);
          }
        } else { // dislike
          if (dislikes.has(userId)) {
            dislikes.delete(userId);
          } else {
            dislikes.add(userId);
            likes.delete(userId);
          }
        }
        return { ...c, likes: Array.from(likes), dislikes: Array.from(dislikes) };
      }
      return c;
    });
    persistComments(updatedComments);
  };
  
  const commentTree = useMemo(() => {
    const commentMap: Record<string, CommentWithChildren> = {};
    comments.forEach(comment => {
      commentMap[comment.id] = { ...comment, children: [] };
    });

    const tree: CommentWithChildren[] = [];
    comments.forEach(comment => {
      if (comment.parentId && commentMap[comment.parentId]) {
        commentMap[comment.parentId].children.push(commentMap[comment.id]);
        commentMap[comment.parentId].children.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else {
        tree.push(commentMap[comment.id]);
      }
    });

    return tree.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [comments]);


  const CommentItem = ({ comment, level = 0 }: { comment: CommentWithChildren, level?: number }) => {
    const isReplying = replyingTo === comment.id;
    const [replyText, setReplyText] = useState("");

    return (
      <div className="flex gap-4">
        <Avatar>
          <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{comment.userName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </p>
            {comment.editedAt && (
              <p className="text-xs text-muted-foreground italic">(đã sửa)</p>
            )}
          </div>
          <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{comment.text}</p>
          <div className="mt-2 flex items-center gap-4 text-muted-foreground">
            <Button variant="ghost" size="sm" onClick={() => handleVote(comment.id, 'like')} disabled={!isLoggedIn} className="gap-1 px-2 h-auto">
              <ThumbsUp className={cn("h-4 w-4", user && comment.likes.includes(user.id) && "text-primary fill-primary/20")} />
              <span className="text-xs">{comment.likes.length}</span>
            </Button>
             <Button variant="ghost" size="sm" onClick={() => handleVote(comment.id, 'dislike')} disabled={!isLoggedIn} className="gap-1 px-2 h-auto">
              <ThumbsDown className={cn("h-4 w-4", user && comment.dislikes.includes(user.id) && "text-destructive fill-destructive/20")} />
               <span className="text-xs">{comment.dislikes.length}</span>
            </Button>
             <Button variant="ghost" size="sm" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} disabled={!isLoggedIn} className="gap-1 px-2 h-auto">
              <MessageSquareReply className="h-4 w-4" />
              <span className="text-xs">Trả lời</span>
            </Button>
          </div>

          {isReplying && (
            <div className="mt-4 flex gap-4">
               <Avatar>
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="w-full space-y-2">
                <Textarea
                  placeholder={`Trả lời ${comment.userName}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setReplyingTo(null)}>Hủy</Button>
                  <Button onClick={() => {
                    handlePostComment(replyText, comment.id);
                    setReplyText("");
                  }} disabled={!replyText.trim()}>Gửi</Button>
                </div>
              </div>
            </div>
          )}

          {comment.children.length > 0 && (
            <div className="mt-4 space-y-4 pl-6 border-l">
              {comment.children.map(child => <CommentItem key={child.id} comment={child} level={level + 1} />)}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold font-headline mb-4">Thảo luận ({comments.length})</h2>
      <Card>
        <CardContent className="p-6">
          {!isLoggedIn ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-8">
              <p className="font-medium">Bạn muốn tham gia thảo luận?</p>
              <p className="text-sm mt-1">
                <Link href="/login" className="text-primary underline hover:text-primary/80">Đăng nhập</Link> hoặc{' '}
                <Link href="/signup" className="text-primary underline hover:text-primary/80">Đăng ký</Link> để đăng bình luận.
              </p>
            </div>
          ) : (
            <div className="flex gap-4">
              <Avatar>
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="w-full space-y-2">
                <Textarea
                  placeholder="Viết bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={() => handlePostComment(newComment, null)} disabled={!newComment.trim()}>Đăng bình luận</Button>
                </div>
              </div>
            </div>
          )}
          
          {commentTree.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="space-y-6">
                {commentTree.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
