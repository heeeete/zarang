import { Metadata } from 'next'
import { createClient } from '@/src/shared/lib/supabase/server'
import { PostDetailsPage } from '@/src/pages/post-details/ui/PostDetailsPage'

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('id', id)
    .single()

  return {
    title: post ? '자랑거리 - ZARANG' : '게시글 - ZARANG',
  }
}

export default PostDetailsPage
