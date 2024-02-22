import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Post {
    id: number;
    title: string;
}

interface Comment {
    id: number;
    content: string;
}

const MyPage: React.FC = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const userNickname = localStorage.getItem('userNickname') || '';

    useEffect(() => {
        fetchUserPostsAndComments();
    }, []);

    const fetchUserPostsAndComments = async () => {
        try {
            const postsPromise = fetch(`http://localhost:4000/my-posts`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            const commentsPromise = fetch(`http://localhost:4000/my-comments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            const [postsResponse, commentsResponse] = await Promise.all([postsPromise, commentsPromise]);

            if (postsResponse.ok && commentsResponse.ok) {
                const postsData = await postsResponse.json();
                const commentsData = await commentsResponse.json();

                setPosts(postsData.map((post: any) => ({ id: post.post_id, title: post.post_title })));
                setComments(commentsData.map((comment: any) => ({ id: comment.review_id, content: comment.review_text })));
            } else {
                console.error('Failed to fetch data');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const handleEditPost = (postId: number) => {
        navigate(`/post/edit/${postId}`);
    };

    const handleDeletePost = async (postId: number) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                const response = await fetch(`http://localhost:4000/posts/${postId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });

                if (response.ok) {
                    alert('Post deleted successfully.');
                    setPosts(posts.filter(post => post.id !== postId));
                } else {
                    alert('Failed to delete the post.');
                }
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('An error occurred while deleting the post.');
            }
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                const response = await fetch(`http://localhost:4000/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });

                if (response.ok) {
                    alert('Comment deleted successfully.');
                    setComments(comments.filter(comment => comment.id !== commentId));
                } else {
                    alert('Failed to delete the comment.');
                }
            } catch (error) {
                console.error('Error deleting comment:', error);
                alert('An error occurred while deleting the comment.');
            }
        }
    };

    return (
        <div>
            <h1>My Page</h1>
            <h2>Hi, {userNickname}</h2>
            <h3>My Posts</h3>
            <ul>
                {posts.map(post => (
                    <li key={post.id}>
                        {post.title}
                        <button onClick={() => handleEditPost(post.id)}>Edit</button>
                        <button onClick={() => handleDeletePost(post.id)}>Delete</button>
                    </li>
                ))}
            </ul>
            <h3>My Comments</h3>
            <ul>
                {comments.map(comment => (
                    <li key={comment.id}>
                        {comment.content}
                        <button onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MyPage;
