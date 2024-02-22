import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Post {
  id: number;
  title: string;
  content: string;
  nickname: string;
}

interface Comment {
  review_id: number;
  review_text: string;
  user_nickname: string;
}

const accessToken = localStorage.getItem('accessToken');

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const userNickname = localStorage.getItem('userNickname');

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`http://localhost:4000/posts/${postId}`);
      console.log('response:', response);
      if (response.ok) {
        const data = await response.json();
        console.log('data:', data);
        setPost({
          id: data.post_id,
          title: data.post_title,
          content: data.post_text,
          nickname: data.user_nickname
        });
      } else {
        console.error('Failed to fetch post');
        alert('Post not found');
        navigate('/main');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:4000/posts/${postId}/comments`); // URL 수정됨
      if (response.ok) {
        const data = await response.json();
        setComments(data);
        console.log('comments:', data);
      } else {
        console.error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`http://localhost:4000/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          review_text: newComment,
        }),
      });
      console.log('response:', response);
      if (response.ok) {
        setNewComment('');
        fetchComments();
      } else {
        throw new Error('Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Error submitting comment');
    }
  };


  const handleCommentDelete = async (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const response = await fetch(`http://localhost:4000/comments/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          fetchComments();
        } else {
          throw new Error('Failed to delete comment');
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error deleting comment');
      }
    }
  };

  const handlePostEdit = () => {
    navigate(`/post/edit/${postId}`);
  };  

  const handlePostDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(`http://localhost:4000/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          alert('Post deleted successfully');
          navigate('/main');
        } else {
          throw new Error('Failed to delete the post');
        }
      } catch (error) {
        console.error('Delete post error:', error);
        alert('Error deleting post');
      }
    }
  };
  console.log('comments:', comments);
  return (
    <div>
      <h1>Title : {post?.title}</h1>
      <p>Contents : {post?.content}</p>
      <p>Nickname : {post?.nickname}</p>
      {post?.nickname === userNickname && (
        <>
          <button onClick={handlePostEdit}>Edit</button>
          <button onClick={handlePostDelete}>Delete</button>
        </>
      )}
      <div>
        <h5>Comments</h5>
        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} />
        <button onClick={handleCommentSubmit}>comment</button>
        {comments.map((comment) => (
          <div key={comment.review_id}>
            <p>{comment.review_text} - {comment.user_nickname}</p>
            {comment.user_nickname === userNickname && (
              <button onClick={() => handleCommentDelete(comment.review_id)}>Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostPage;
