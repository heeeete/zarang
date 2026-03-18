import { PostCreateForm } from '@/src/features/post-creation/ui/PostCreateForm';

export const WritePage = () => {
  return (
    <div className="flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-xl font-bold">새 자랑하기</h1>
      </div>
      <PostCreateForm />
    </div>
  );
};
