import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Main from './pages/Main'
import Categories from "./pages/Categories";
import Category from "./pages/Category"
import AddCategory from "./pages/AddCategory";
import Upload from "./pages/Upload"
import './App.css';
import Search from "./pages/Search";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Image from "./pages/Image";
import Account from "./pages/Account";

function App() {
  return (
    <div className="bg-gray-700 h-screen">
      <Router>  
        <Navbar />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:categoryId" element={<Category />}/>
          <Route path="/add_category" element={<RequireAuth><AddCategory /></RequireAuth>} />
          <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
          <Route path="/search" element={<Search />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/image/:id" element={<Image />} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
