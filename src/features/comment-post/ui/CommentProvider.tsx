'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

interface CommentContextType {
  replyingTo: { parentId: string; username: string; targetId: string } | null;
  editingComment: { id: string; content: string } | null;
  setReplyingTo: (data: { parentId: string; username: string; targetId: string } | null) => void;
  setEditingComment: (data: { id: string; content: string } | null) => void;
  refreshTrigger: number;
  refetchComments: () => void;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

export const CommentProvider = ({ children }: { children: ReactNode }) => {
  const [replyingTo, setReplyingTo] = useState<CommentContextType['replyingTo']>(null);
  const [editingComment, setEditingComment] = useState<CommentContextType['editingComment']>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetchComments = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const value = useMemo(() => ({
    replyingTo,
    editingComment,
    setReplyingTo,
    setEditingComment,
    refreshTrigger,
    refetchComments
  }), [replyingTo, editingComment, refreshTrigger, refetchComments]);

  return (
    <CommentContext.Provider value={value}>
      {children}
    </CommentContext.Provider>
  );
};

export const useCommentContext = () => {
  const context = useContext(CommentContext);
  if (!context) throw new Error('useCommentContext must be used within a CommentProvider');
  return context;
};
