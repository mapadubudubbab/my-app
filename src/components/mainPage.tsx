import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Post {
    id: number;
    title: string;
    nickname: string;
}

interface FetchError {
    message: string;
}

const MainPage: React.FC = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchType, setSearchType] = useState<'title' | 'content' | 'nickname'>('title');
    const [userNickname, setUserNickname] = useState<string>('');

    useEffect(() => {
        fetchPosts();
        const nickname = localStorage.getItem('userNickname');
        if (nickname) {
            setUserNickname(nickname);
        }
    }, []);

    const fetchPosts = async (search = false) => {
        try {
            const query = search ? `?search=${searchTerm}&type=${searchType}` : '';
            const response = await fetch(`http://localhost:4000/posts${query}`);
            if (response.ok) {
                const rawData = await response.json();
                const data = rawData.map((item: any) => ({
                    id: item.post_id,
                    title: item.post_title,
                    nickname: item.user_nickname
                })) as Post[];
                setPosts(data);
                console.log('data:', data);
            } else {
                console.error('Failed to fetch posts');
            }
        } catch (error) {
            console.error(error);
        }
    };


    const handleSearch = () => {
        fetchPosts(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        navigate('/');
    };

    const goToPost = (postId: number) => {
        navigate(`/post/${postId}`);
    };

    console.log('posts : ', posts)

    return (
        <div>
            <h1>Main Page</h1>
            <div style={{ float: 'right' }}>Hi, {userNickname}</div>
            <select value={searchType} onChange={(e) => setSearchType(e.target.value as typeof searchType)}>
                <option value="title">Title</option>
                <option value="content">Content</option>
                <option value="nickname">Nickname</option>
            </select>
            <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSearch();
                    }
                }}
            />

            <button onClick={handleSearch}>Search</button>
            <button onClick={() => navigate('/upload')}>Write Post</button>
            <button onClick={() => navigate('/my-page')}>My Page</button>
            <button onClick={handleLogout}>Logout</button>
            <ul>
                {posts.map(post => (
                    <li key={post.id} onClick={() => goToPost(post.id)} style={{ cursor: 'pointer' }}>
                        {post.title} by {post.nickname}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MainPage;
