"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const fallbackPosts = [
  {
    id: '1',
    display_order: 1,
    title: 'Full-Frame vs. Crop Sensor: Which for Photography?',
    description: "An honest look at the real-world differences between these camera systems to help you choose what's actually right for your photography needs.",
    author: 'By August Renner (c)',
    category: 'Gear',
    category_color: '#7d1a4a',
    video_url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_155500_808e6fdd-761f-4acd-b3be-cb7e6e700def.mp4',
    is_featured: true,
  },
  {
    id: '2',
    display_order: 2,
    title: 'Finding Natural Light in Unexpected Places',
    category: 'Lighting',
    category_color: '#2c4c34',
    video_url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_030111_a9e15665-d379-4a7f-8116-695bbe452ad1.mp4',
  },
  {
    id: '3',
    display_order: 3,
    title: 'My Approach to Editing: Creating a Consistent Photography Style',
    category: 'Editing',
    category_color: '#a63e2d',
    video_url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4',
  },
  {
    id: '4',
    display_order: 4,
    title: 'Pricing Your Photography: Strategies That Work',
    category: 'Business',
    category_color: '#1a2b8c',
    video_url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_154232_f8809bd2-a6c3-4a38-908d-2005e5b3cb3e.mp4',
  }
];

export interface BlogPost {
  id: string;
  display_order: number;
  title: string;
  description?: string;
  author?: string;
  category: string;
  category_color: string;
  video_url: string;
  is_featured?: boolean;
}

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data } = await supabase.from('blog_posts').select('*').order('display_order', { ascending: true });
        if (data && data.length > 0) setPosts(data as BlogPost[]);
        else setPosts(fallbackPosts);
      } catch {
        setPosts(fallbackPosts);
      }
    }
    fetchPosts();
  }, []);

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const gridPosts = posts.slice(1, 4);

  return (
    <section className="w-full bg-[#0c0c0c] text-white py-[60px] px-5 relative z-20 border-t border-white/10 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <div className="inline-block px-3 py-1 bg-white/10 text-white rounded-lg text-xs font-semibold uppercase tracking-wider mb-4">
              Blog
            </div>
            <h2 className="font-outfit font-medium text-[48px] md:text-[64px] tracking-[-2.5px] leading-none mb-6">
              Behind the lens
            </h2>
            <p className="text-white/60 text-lg font-medium opacity-80 max-w-[480px] leading-[1.6]">
              Thoughts, insights, and stories from my photography journey. Take a peek into my creative process and recent projects.
            </p>
          </div>
          <button className="bg-white text-black rounded-full px-6 py-3 text-sm font-semibold hover:scale-[1.02] transition-transform self-start md:self-end shrink-0">
            View all posts
          </button>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="group border border-white/10 rounded-[20px] bg-[#0e1014] overflow-hidden grid lg:grid-cols-2 min-h-[520px] mb-[25px]">
            <div className="relative h-[300px] lg:h-auto overflow-hidden">
              <video 
                className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-105"
                autoPlay loop muted playsInline
                src={featuredPost.video_url}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-[400ms]"></div>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-[70px] h-[70px] rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
                  <span className="text-white text-2xl font-light">+</span>
                </div>
              </div>
              {/* Brackets */}
              <div className="absolute top-[15px] left-[15px] w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-white/20"></div>
              <div className="absolute top-[15px] right-[15px] w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-white/20"></div>
              <div className="absolute bottom-[15px] left-[15px] w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-white/20"></div>
              <div className="absolute bottom-[15px] right-[15px] w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-white/20"></div>
            </div>
            
            <div className="p-10 lg:p-[60px] flex flex-col items-start h-full">
              <span className="bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
                Must Read
              </span>
              <h3 className="font-outfit font-medium text-[32px] md:text-[48px] tracking-[-1.5px] leading-tight mb-4">
                {featuredPost.title}
              </h3>
              <p className="text-white/60 text-[17px] leading-relaxed mb-8">
                {featuredPost.description}
              </p>
              <div className="mt-auto w-full flex items-center justify-between pt-6 border-t border-white/10">
                <span className="text-sm text-white/60 font-medium">{featuredPost.author}</span>
                <span 
                  className="px-3 py-1 rounded-full text-white text-[11px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: featuredPost.category_color }}
                >
                  {featuredPost.category}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Grid Posts */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[25px]">
          {gridPosts.map((post) => (
            <div key={post.id} className="flex flex-col gap-4">
              <div className="group relative rounded-[20px] overflow-hidden aspect-[16/10] bg-black/20 border border-white/5">
                <video 
                  className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-105"
                  autoPlay loop muted playsInline
                  src={post.video_url}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-[400ms]"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-[70px] h-[70px] rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
                    <span className="text-white text-2xl font-light">+</span>
                  </div>
                </div>
                {/* Brackets */}
                <div className="absolute top-[15px] left-[15px] w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-white/20"></div>
                <div className="absolute top-[15px] right-[15px] w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-white/20"></div>
                <div className="absolute bottom-[15px] left-[15px] w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-white/20"></div>
                <div className="absolute bottom-[15px] right-[15px] w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-white/20"></div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <h4 className="font-outfit font-semibold text-[17px] leading-snug tracking-tight text-white/90 group-hover:text-white transition-colors">
                  {post.title}
                </h4>
                <span 
                  className="px-3 py-1 rounded-full text-white text-[11px] font-semibold uppercase tracking-wide shrink-0"
                  style={{ backgroundColor: post.category_color }}
                >
                  {post.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
