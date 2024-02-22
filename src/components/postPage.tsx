import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Post {
  id: number;
  title: string;
  content: string;
  nickname: string;
}

interface Comment {
  id: number;
  content: string;
  nickname: string;
}

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const userNickname = localStorage.getItem('userNickname'); // 현재 로그인한 사용자 닉네임

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    // 서버에서 postId에 해당하는 게시글 정보 불러오기
  };

  const fetchComments = async () => {
    // 서버에서 postId에 해당하는 댓글 정보 불러오기
  };

  const handleCommentSubmit = async () => {
    // 댓글 추가 로직
  };

  const handleCommentDelete = async (commentId: number) => {
    // 댓글 삭제 로직
  };

  const handlePostEdit = () => {
    navigate(`/post/${postId}/edit`);
  };

  const handlePostDelete = async () => {
    // 게시글 삭제 로직
  };

  return (
    <div>
      <h1>{post?.title}</h1>
      <p>{post?.content}</p>
      <p>작성자: {post?.nickname}</p>
      {post?.nickname === userNickname && (
        <>
          <button onClick={handlePostEdit}>수정</button>
          <button onClick={handlePostDelete}>삭제</button>
        </>
      )}
      <div>
        <h2>댓글</h2>
        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} />
        <button onClick={handleCommentSubmit}>댓글 달기</button>
        {comments.map((comment) => (
          <div key={comment.id}>
            <p>{comment.content} - {comment.nickname}</p>
            {comment.nickname === userNickname && (
              <button onClick={() => handleCommentDelete(comment.id)}>삭제</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostPage;
