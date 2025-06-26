import React, { useState, useEffect } from 'react';
import './App.css'; // Will include the slide-rotate-hor-b-fwd animation

// Import Supabase client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [cakes, setCakes] = useState([]);
  const [hours, setHours] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [users, setUsers] = useState([]);

  // Admin login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Form states for admin panel
  const [newCake, setNewCake] = useState({ name: '', price: '', description: '' });
  const [editingCakeId, setEditingCakeId] = useState(null);
  const [cakeImageFile, setCakeImageFile] = useState(null);
  const [newHour, setNewHour] = useState({ day: '', hours: '' });
  const [newTestimonial, setNewTestimonial] = useState({ name: '', comment: '' });

  // Load data from Supabase
  useEffect(() => {
    if (isAdminLoggedIn) {
      loadCakes();
      loadHours();
      loadTestimonials();
      loadContactInfo();
      loadUsers();
    }
  }, [isAdminLoggedIn]);

  // Load cakes
  const loadCakes = async () => {
    const { data, error } = await supabase.from('cakes').select('*');
    if (error) console.error(error);
    else setCakes(data);
  };

  // Load business hours
  const loadHours = async () => {
    const { data, error } = await supabase.from('hours').select('*');
    if (error) console.error(error);
    else setHours(data);
  };

  // Load testimonials
  const loadTestimonials = async () => {
    const { data, error } = await supabase.from('testimonials').select('*');
    if (error) console.error(error);
    else setTestimonials(data);
  };

  // Load contact info
  const loadContactInfo = async () => {
    const { data, error } = await supabase.from('contact').select('*').single();
    if (error) console.error(error);
    else setContactInfo(data);
  };

  // Load users
  const loadUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) console.error(error);
    else setUsers(data);
  };

  // Admin login
  const handleAdminLogin = async () => {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', adminEmail)
      .eq('password', adminPassword)
      .single();

    if (error) {
      alert('Invalid email or password');
      return;
    }

    setIsAdminLoggedIn(true);
    setCurrentView('dashboard');
  };

  // Add cake
  const addCake = async () => {
    if (!cakeImageFile) {
      alert('Please upload an image');
      return;
    }

    const fileExt = cakeImageFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('cakes-images')
      .upload(fileName, cakeImageFile);

    if (uploadError) {
      console.error(uploadError);
      alert('Error uploading image');
      return;
    }

    const imageUrl = `https://${supabaseUrl.split('//')[1]}/storage/v1/object/public/cakes-images/${fileName}`; 

    const { error: insertError } = await supabase
      .from('cakes')
      .insert([{ ...newCake, image_url: imageUrl }]);

    if (insertError) {
      console.error(insertError);
      alert('Error adding cake');
      return;
    }

    setNewCake({ name: '', price: '', description: '' });
    setCakeImageFile(null);
    loadCakes();
  };

  // Edit cake
  const editCake = async () => {
    let imageUrl = newCake.image_url;

    if (cakeImageFile) {
      const fileExt = cakeImageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('cakes-images')
        .upload(fileName, cakeImageFile);

      if (uploadError) {
        console.error(uploadError);
        alert('Error uploading image');
        return;
      }

      imageUrl = `https://${supabaseUrl.split('//')[1]}/storage/v1/object/public/cakes-images/${fileName}`; 
    }

    const { error } = await supabase
      .from('cakes')
      .update({ ...newCake, image_url: imageUrl })
      .eq('id', editingCakeId);

    if (error) {
      console.error(error);
      alert('Error updating cake');
      return;
    }

    setEditingCakeId(null);
    setNewCake({ name: '', price: '', description: '' });
    setCakeImageFile(null);
    loadCakes();
  };

  // Delete cake
  const deleteCake = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cake?')) return;

    const { error } = await supabase.from('cakes').delete().eq('id', id);

    if (error) {
      console.error(error);
      alert('Error deleting cake');
      return;
    }

    loadCakes();
  };

  // Add business hour
  const addBusinessHour = async () => {
    const { error } = await supabase
      .from('hours')
      .insert([{ ...newHour }]);

    if (error) {
      console.error(error);
      alert('Error adding business hour');
      return;
    }

    setNewHour({ day: '', hours: '' });
    loadHours();
  };

  // Edit business hour
  const editBusinessHour = async (id) => {
    const { error } = await supabase
      .from('hours')
      .update(newHour)
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('Error updating business hour');
      return;
    }

    setNewHour({ day: '', hours: '' });
    loadHours();
  };

  // Delete business hour
  const deleteBusinessHour = async (id) => {
    if (!window.confirm('Are you sure you want to delete this business hour?')) return;

    const { error } = await supabase.from('hours').delete().eq('id', id);

    if (error) {
      console.error(error);
      alert('Error deleting business hour');
      return;
    }

    loadHours();
  };

  // Add testimonial
  const addTestimonial = async () => {
    const { error } = await supabase
      .from('testimonials')
      .insert([{ ...newTestimonial }]);

    if (error) {
      console.error(error);
      alert('Error adding testimonial');
      return;
    }

    setNewTestimonial({ name: '', comment: '' });
    loadTestimonials();
  };

  // Edit testimonial
  const editTestimonial = async (id) => {
    const { error } = await supabase
      .from('testimonials')
      .update(newTestimonial)
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('Error updating testimonial');
      return;
    }

    setNewTestimonial({ name: '', comment: '' });
    loadTestimonials();
  };

  // Delete testimonial
  const deleteTestimonial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;

    const { error } = await supabase.from('testimonials').delete().eq('id', id);

    if (error) {
      console.error(error);
      alert('Error deleting testimonial');
      return;
    }

    loadTestimonials();
  };

  // Update contact info
  const updateContactInfo = async () => {
    const { error } = await supabase
      .from('contact')
      .upsert(contactInfo);

    if (error) {
      console.error(error);
      alert('Error updating contact info');
      return;
    }

    loadContactInfo();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-pink-500 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Melita Bakes</h1>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="#home" className="hover:underline">Home</a></li>
              <li><a href="#about" className="hover:underline">About</a></li>
              <li><a href="#contact" className="hover:underline">Contact</a></li>
              {!isAdminLoggedIn && <li><a href="/admin" className="hover:underline">Admin</a></li>}
            </ul>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-4">
        {currentView === 'home' && (
          <>
            {/* Hero Section */}
            <section id="home" className="py-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Delicious Cakes by Melita</h2>
              <p className="text-xl max-w-2xl mx-auto mb-8">Crafting beautiful and tasty cakes since 2023.</p>
              <img src="https://placehold.co/600x400"  alt="Melita Bakes" className="mx-auto rounded-lg shadow-lg" />
            </section>

            {/* Cake Carousel */}
            <section className="py-12">
              <h3 className="text-2xl font-bold mb-6 text-center">Our Cakes</h3>
              <div className="overflow-x-scroll pb-4 hide-scrollbar">
                <div className="flex space-x-4">
                  {cakes.map((cake) => (
                    <div key={cake.id} className="w-64 h-96 bg-gray-100 rounded-lg overflow-hidden shadow-md">
                      <div className="relative w-full h-64">
                        <img 
                          src={cake.image_url} 
                          alt={cake.name} 
                          className="w-full h-full object-cover slide-rotate-hor-b-fwd" 
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-lg">{cake.name}</h4>
                        <p className="text-gray-700">${cake.price}</p>
                        <p className="text-sm text-gray-600 mt-2">{cake.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="py-12">
              <h3 className="text-2xl font-bold mb-6 text-center">What Our Customers Say</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="bg-gray-100 p-6 rounded-lg shadow-md">
                    <p className="italic mb-4">"{testimonial.comment}"</p>
                    <p className="font-semibold">{testimonial.name}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Business Hours */}
            <section id="hours" className="py-12">
              <h3 className="text-2xl font-bold mb-6 text-center">Business Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hours.map((hour) => (
                  <div key={hour.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h4 className="font-bold text-lg">{hour.day}</h4>
                    <p>{hour.hours}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Info */}
            <section id="contact" className="py-12">
              <h3 className="text-2xl font-bold mb-6 text-center">Contact Us</h3>
              <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <p className="mb-2"><strong>Phone:</strong> {contactInfo?.phone || 'N/A'}</p>
                <p className="mb-2"><strong>Instagram:</strong> <a href={`https://instagram.com/${contactInfo?.instagram}`} target="_blank" rel="noopener noreferrer">@{contactInfo?.instagram || 'N/A'}</a></p>
                <p><strong>Address:</strong> {contactInfo?.address || 'N/A'}</p>
              </div>
            </section>
          </>
        )}

        {currentView === 'admin-login' && (
          <section className="py-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Admin Login</h2>
            <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    Email
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    value={adminEmail} 
                    onChange={(e) => setAdminEmail(e.target.value)} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                    required 
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                    Password
                  </label>
                  <input 
                    type="password" 
                    id="password" 
                    value={adminPassword} 
                    onChange={(e) => setAdminPassword(e.target.value)} 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Login
                </button>
              </form>
            </div>
          </section>
        )}

        {isAdminLoggedIn && currentView === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h2>

            {/* Manage Cakes */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Manage Cakes</h3>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-2">Add New Cake</h4>
                    <form onSubmit={(e) => { e.preventDefault(); editingCakeId ? editCake() : addCake(); }}>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                          Name
                        </label>
                        <input 
                          type="text" 
                          id="name" 
                          value={newCake.name} 
                          onChange={(e) => setNewCake({...newCake, name: e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          required 
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                          Price
                        </label>
                        <input 
                          type="number" 
                          id="price" 
                          value={newCake.price} 
                          onChange={(e) => setNewCake({...newCake, price: e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          required 
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                          Description
                        </label>
                        <textarea 
                          id="description" 
                          value={newCake.description} 
                          onChange={(e) => setNewCake({...newCake, description: e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          rows="3" 
                          required 
                        ></textarea>
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                          Image
                        </label>
                        <input 
                          type="file" 
                          id="image" 
                          accept="image/*" 
                          onChange={(e) => setCakeImageFile(e.target.files[0])} 
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      >
                        {editingCakeId ? 'Update Cake' : 'Add Cake'}
                      </button>
                    </form>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Current Cakes</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {cakes.map((cake) => (
                            <tr key={cake.id}>
                              <td className="px-6 py-4 whitespace-nowrap">{cake.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap">${cake.price}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button 
                                  onClick={() => {
                                    setEditingCakeId(cake.id);
                                    setNewCake({
                                      name: cake.name,
                                      price: cake.price,
                                      description: cake.description,
                                      image_url: cake.image_url
                                    });
                                  }} 
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => deleteCake(cake.id)} 
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Manage Business Hours */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Manage Business Hours</h3>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-2">Add New Hour</h4>
                    <form onSubmit={(e) => { e.preventDefault(); addBusinessHour(); }}>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="day">
                          Day
                        </label>
                        <input 
                          type="text" 
                          id="day" 
                          value={newHour.day} 
                          onChange={(e) => setNewHour({...newHour, day: e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          required 
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hours">
                          Hours
                        </label>
                        <input 
                          type="text" 
                          id="hours" 
                          value={newHour.hours} 
                          onChange={(e) => setNewHour({...newHour, hours: e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          required 
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      >
                        Add Hour
                      </button>
                    </form>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Current Hours</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {hours.map((hour) => (
                            <tr key={hour.id}>
                              <td className="px-6 py-4 whitespace-nowrap">{hour.day}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{hour.hours}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button 
                                  onClick={() => {
                                    setNewHour(hour);
                                    editBusinessHour(hour.id);
                                  }} 
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => deleteBusinessHour(hour.id)} 
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Manage Testimonials */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Manage Testimonials</h3>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-2">Add New Testimonial</h4>
                    <form onSubmit={(e) => { e.preventDefault(); addTestimonial(); }}>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                          Name
                        </label>
                        <input 
                          type="text" 
                          id="name" 
                          value={newTestimonial.name} 
                          onChange={(e) => setNewTestimonial({...newTestimonial, name: e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          required 
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comment">
                          Comment
                        </label>
                        <textarea 
                          id="comment" 
                          value={newTestimonial.comment} 
                          onChange={(e) => setNewTestimonial({...newTestimonial, comment: e.target.value})} 
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          rows="3" 
                          required 
                        ></textarea>
                      </div>
                      <button 
                        type="submit" 
                        className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      >
                        Add Testimonial
                      </button>
                    </form>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Current Testimonials</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {testimonials.map((testimonial) => (
                            <tr key={testimonial.id}>
                              <td className="px-6 py-4 whitespace-nowrap">{testimonial.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{testimonial.comment}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button 
                                  onClick={() => {
                                    setNewTestimonial(testimonial);
                                    editTestimonial(testimonial.id);
                                  }} 
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => deleteTestimonial(testimonial.id)} 
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Manage Contact Info */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Manage Contact Info</h3>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                <form onSubmit={(e) => { e.preventDefault(); updateContactInfo(); }}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                      Phone
                    </label>
                    <input 
                      type="text" 
                      id="phone" 
                      value={contactInfo?.phone || ''} 
                      onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                      required 
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="instagram">
                      Instagram Handle
                    </label>
                    <input 
                      type="text" 
                      id="instagram" 
                      value={contactInfo?.instagram || ''} 
                      onChange={(e) => setContactInfo({...contactInfo, instagram: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                      required 
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                      Address
                    </label>
                    <input 
                      type="text" 
                      id="address" 
                      value={contactInfo?.address || ''} 
                      onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                      required 
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Update Contact Info
                  </button>
                </form>
              </div>
            </section>

            {/* View Users */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Registered Users</h3>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-700 p-6 mt-12">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} Melita Bakes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
