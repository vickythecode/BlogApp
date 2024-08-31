import React from 'react';
import { Navigate } from 'react-router-dom';

const DeletePost = ({ postId, onDeleteSuccess }) => {

  const deletePost = async () => {
    try {
      const response = await fetch(`http://localhost:4000/post/${postId}`, {
        method: 'DELETE',
        credentials: 'include', // To send cookies with the request
      });

      if (response.ok) {
        alert('Post deleted successfully');
        if (onDeleteSuccess) {
          onDeleteSuccess(); // Callback to update the UI without refreshing
        } else {
          return <Navigate to={'/'} /> // Navigate to homepage if no callback is provided
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to delete post:', errorData);
        alert(`Failed to delete post: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  return (
    <button onClick={deletePost} className="delete-button">
      Delete Post
    </button>
  );
};

export default DeletePost;
