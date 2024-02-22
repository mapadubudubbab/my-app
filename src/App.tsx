import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './components/homePage';
import MainPage from './components/mainPage';
import SignUpPage from './components/signUpPage';
import EmailCheckPage from './components/emailCheckPage';
import NewPasswordPage from './components/newPasswordPage';
import UploadPage from './components/uploadPage';
import MyPage from './components/myPage';
import PostPage from './components/postPage';
import EditPage from './components/editPage';

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/main" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
          <Route path='/signup' element={<SignUpPage />} />
          <Route path='/email-check' element={<EmailCheckPage />} />
          <Route path='/reset-password' element={<NewPasswordPage />} />
          <Route path='/upload' element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path='/my-page' element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path='/post/:postId' element={<ProtectedRoute><PostPage /></ProtectedRoute>} />
          <Route path='/post/edit/:postId' element={<ProtectedRoute><EditPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
