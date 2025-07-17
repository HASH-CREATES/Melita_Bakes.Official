/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const HomePage = () => {
  const [cakes, setCakes] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [hours, setHours] = useState([]);
  const [contact, setContact] = useState({});
  const [logo, setLogo] = useState('');

  useEffect(() => {
    (async () => {
      const [
        { data: cakesData },
        { data: testimonialsData },
        { data: hoursData },
        { data: contactData },
        { data: logoData }
      ] = await Promise.all([
        supabase.from('cakes').select('*').order('created_at', { ascending: false }),
        supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
        supabase.from('hours').select('*').order('id'),
        supabase.from('contact').select('*').single(),
        supabase.from('site_settings').select('logo_url').single()
      ]);
      setCakes(cakesData || []);
      setTestimonials(testimonialsData || []);
      setHours(hoursData || []);
      setContact(contactData || {});
      setLogo(logoData?.logo_url || '');
    })();
  }, []);

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="fixed w-full z-50 bg-white/90 backdrop-blur shadow-md">
        <div className="container mx-auto flex justify-between items-center py-3 px-6">
          <div className="logo">
            {logo ? (
              <img src={logo} alt="Logo" className="w-14 h-14 rounded-full" />
            ) : (
              <span className="text-2xl font-bold text-pink-600">MB</span>
            )}
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#home" className="hover:text-pink-500">Home</a>
            <a href="#about" className="hover:text-pink-500">About</a>
            <a href="#cakes" className="hover:text-pink-500">Cakes</a>
            <a href="#testimonials" className="hover:text-pink-500">Testimonials</a>
            <a href="#contact" className="hover:text-pink-500">Contact</a>
            <a href="/admin" className="opacity-30 hover:opacity-100">Admin</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="min-h-screen bg-cover bg-center flex items-center justify-center text-white"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1552689486-6773ca4e3f81?auto=format&fit=crop&w=2070&q=80')` }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl font-bold mb-4">Melita Bakes</h1>
          <p className="text-xl mb-6">Homemade cakes for every sweet moment.</p>
          <a href="#cakes" className="bg-pink-500 px-6 py-3 rounded-full hover:bg-pink-600">Explore Cakes</a>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Our Story</h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            From our family kitchen to your celebrations, every cake is baked with love.
          </p>
        </div>
      </section>

      {/* Cakes */}
      <section id="cakes" className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Our Signature Cakes</h2>
          <div className="responsive-grid">
            {cakes.map((cake) => (
              <div key={cake.id} className="bg-white rounded shadow p-4">
                <img src={cake.image_url} alt={cake.name} className="cake-image" />
                <h3 className="text-lg font-bold">{cake.name}</h3>
                <p className="text-pink-600 font-bold">₹{cake.price}</p>
                <p className="text-sm text-gray-600 mt-1">{cake.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Sweet Words</h2>
          <div className="responsive-grid">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded shadow">
                <p className="italic">"{t.comment}"</p>
                <p className="mt-2 font-bold">– {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hours */}
      <section id="hours" className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Business Hours</h2>
          <div className="max-w-lg mx-auto space-y-2">
            {hours.map((h) => (
              <div key={h.id} className="flex justify-between bg-white p-3 rounded shadow">
                <span>{h.day}</span>
                <span>{h.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Get In Touch</h2>
          <p><strong>Phone:</strong> {contact.phone}</p>
          <p>
            <strong>Instagram:</strong>{' '}
            <a href={`https://instagram.com/${contact.instagram}`} className="text-pink-500">
              @{contact.instagram}
            </a>
          </p>
          <p><strong>Address:</strong> {contact.address}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 text-center">
        <p>&copy; {new Date().getFullYear()} Melita Bakes. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
