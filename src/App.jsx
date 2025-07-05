import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [cakes, setCakes] = useState([]);
  const [hours, setHours] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [contactInfo, setContactInfo] = useState({ phone: '', instagram: '', address: '' });
  const [users, setUsers] = useState([]);

  // Admin login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Form states for admin panel
  const [newCake, setNewCake] = useState({ name: '', price: '', description: '', image_url: '' });
  const [editingCakeId, setEditingCakeId] = useState(null);
  const [cakeImageFile, setCakeImageFile] = useState(null);
  const [newHour, setNewHour] = useState({ day: '', hours: '' });
  const [editingHourId, setEditingHourId] = useState(null);
  const [newTestimonial, setNewTestimonial] = useState({ name: '', comment: '' });
  const [editingTestimonialId, setEditingTestimonialId] = useState(null);

  // Site settings
  const [siteSettings, setSiteSettings] = useState({ logo_url: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadCakes(),
        loadHours(),
        loadTestimonials(),
        loadContactInfo(),
        loadSiteSettings()
      ]);
      if (isAdminLoggedIn) {
        loadUsers();
      }
    };
    loadData();
  }, [isAdminLoggedIn]);

  // Load site settings (logo)
  const loadSiteSettings = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('logo_url')
      .eq('id', 1)
      .single();
    if (error) console.error('Error loading site settings:', error);
    else setSiteSettings(data || { logo_url: '' });
  };

  // Handle logo upload
  const handleLogoUpload = async () => {
    if (!logoFile) {
      alert('Please select a logo file first.');
      return;
    }
    setLogoUploading(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo.${fileExt}`;
      const filePath = `logo/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, logoFile, { upsert: true });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('site-assets')
        .getPublicUrl(filePath);

      // Update DB
      const { error: updateError } = await supabase
        .from('site_settings')
        .upsert({ id: 1, logo_url: publicUrl });
      if (updateError) throw updateError;

      setSiteSettings({ logo_url: publicUrl });
      setLogoFile(null);
      alert('Logo updated successfully!');
    } catch (err) {
      console.error('Logo upload error:', err);
      alert('Failed to upload logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  // Load cakes
  const loadCakes = async () => {
    const { data, error } = await supabase.from('cakes').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setCakes(data || []);
  };

  // Add new cake
  const addCake = async () => {
    if (!cakeImageFile) {
      alert('Please upload an image for the cake');
      return;
    }

    try {
      // Upload image
      const fileExt = cakeImageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('cakes-images')
        .upload(`public/${fileName}`, cakeImageFile);
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('cakes-images')
        .getPublicUrl(`public/${fileName}`);

      // Insert cake record
      const { error } = await supabase
        .from('cakes')
        .insert([{ 
          ...newCake, 
          price: parseFloat(newCake.price),
          image_url: publicUrl 
        }]);
      if (error) throw error;

      // Reset form
      setNewCake({ name: '', price: '', description: '', image_url: '' });
      setCakeImageFile(null);
      loadCakes();
    } catch (err) {
      console.error('Error adding cake:', err);
      alert('Error adding cake. See console for details.');
    }
  };

  // Edit cake
  const editCake = async () => {
    try {
      let imageUrl = newCake.image_url;

      if (cakeImageFile) {
        // Upload new image
        const fileExt = cakeImageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('cakes-images')
          .upload(`public/${fileName}`, cakeImageFile);
        if (uploadError) throw uploadError;

        // Get new public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('cakes-images')
          .getPublicUrl(`public/${fileName}`);
        imageUrl = publicUrl;
      }

      // Update cake record
      const { error } = await supabase
        .from('cakes')
        .update({ 
          ...newCake, 
          price: parseFloat(newCake.price),
          image_url: imageUrl 
        })
        .eq('id', editingCakeId);
      if (error) throw error;

      // Reset form
      setEditingCakeId(null);
      setNewCake({ name: '', price: '', description: '', image_url: '' });
      setCakeImageFile(null);
      loadCakes();
    } catch (err) {
      console.error('Error updating cake:', err);
      alert('Error updating cake. See console for details.');
    }
  };

  // Delete cake
  const deleteCake = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cake?')) return;
    try {
      const { error } = await supabase.from('cakes').delete().eq('id', id);
      if (error) throw error;
      loadCakes();
    } catch (err) {
      console.error('Error deleting cake:', err);
      alert('Error deleting cake. See console for details.');
    }
  };

  // Load business hours
  const loadHours = async () => {
    const { data, error } = await supabase.from('hours').select('*').order('id', { ascending: true });
    if (error) console.error(error);
    else setHours(data || []);
  };

  // Add business hour
  const addBusinessHour = async () => {
    try {
      const { error } = await supabase.from('hours').insert([newHour]);
      if (error) throw error;
      setNewHour({ day: '', hours: '' });
      loadHours();
    } catch (err) {
      console.error('Error adding business hour:', err);
      alert('Error adding business hour. See console for details.');
    }
  };

  // Edit business hour
  const editBusinessHour = async (id) => {
    try {
      const { error } = await supabase.from('hours').update(newHour).eq('id', id);
      if (error) throw error;
      setNewHour({ day: '', hours: '' });
      setEditingHourId(null);
      loadHours();
    } catch (err) {
      console.error('Error updating business hour:', err);
      alert('Error updating business hour. See console for details.');
    }
  };

  // Delete business hour
  const deleteBusinessHour = async (id) => {
    if (!window.confirm('Are you sure you want to delete this business hour?')) return;
    try {
      const { error } = await supabase.from('hours').delete().eq('id', id);
      if (error) throw error;
      loadHours();
    } catch (err) {
      console.error('Error deleting business hour:', err);
      alert('Error deleting business hour. See console for details.');
    }
  };

  // Load testimonials
  const loadTestimonials = async () => {
    const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setTestimonials(data || []);
  };

  // Add testimonial
  const addTestimonial = async () => {
    try {
      const { error } = await supabase.from('testimonials').insert([newTestimonial]);
      if (error) throw error;
      setNewTestimonial({ name: '', comment: '' });
      loadTestimonials();
    } catch (err) {
      console.error('Error adding testimonial:', err);
      alert('Error adding testimonial. See console for details.');
    }
  };

  // Edit testimonial
  const editTestimonial = async (id) => {
    try {
      const { error } = await supabase.from('testimonials').update(newTestimonial).eq('id', id);
      if (error) throw error;
      setNewTestimonial({ name: '', comment: '' });
      setEditingTestimonialId(null);
      loadTestimonials();
    } catch (err) {
      console.error('Error updating testimonial:', err);
      alert('Error updating testimonial. See console for details.');
    }
  };

  // Delete testimonial
  const deleteTestimonial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
      loadTestimonials();
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      alert('Error deleting testimonial. See console for details.');
    }
  };

  // Load contact info
  const loadContactInfo = async () => {
    const { data, error } = await supabase.from('contact').select('*').single();
    if (error) console.error(error);
    else setContactInfo(data || { phone: '', instagram: '', address: '' });
  };

  // Update contact info
  const updateContactInfo = async () => {
    try {
      const { error } = await supabase.from('contact').upsert(contactInfo);
      if (error) throw error;
      alert('Contact information updated successfully!');
      loadContactInfo();
    } catch (err) {
      console.error('Error updating contact info:', err);
      alert('Error updating contact info. See console for details.');
    }
  };

  // Load users
  const loadUsers = async () => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setUsers(data || []);
  };

  // Admin login
  const handleAdminLogin = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('admin_email', adminEmail.trim().toLowerCase())
        .eq('admin_password', adminPassword.trim())
        .single();

      if (error || !data) {
        alert('Invalid credentials');
        return;
      }

      setIsAdminLoggedIn(true);
      setCurrentView('dashboard');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. See console for details.');
    }
  };

  // Admin logout
  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentView('home');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100">
      {/* Header */}
      <header className="bg-pink-500 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => {
            setCurrentView('home');
            window.scrollTo(0, 0);
          }}>Melita Bakes</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <button 
                  onClick={() => {
                    setCurrentView('home');
                    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:underline px-2 py-1 rounded transition hover:bg-pink-600"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setCurrentView('home');
                    setTimeout(() => {
                      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="hover:underline px-2 py-1 rounded transition hover:bg-pink-600"
                >
                  About
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setCurrentView('home');
                    setTimeout(() => {
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="hover:underline px-2 py-1 rounded transition hover:bg-pink-600"
                >
                  Contact
                </button>
              </li>
              {isAdminLoggedIn ? (
                <li>
                  <button 
                    onClick={handleAdminLogout}
                    className="hover:underline px-2 py-1 rounded transition hover:bg-pink-600"
                  >
                    Logout
                  </button>
                </li>
              ) : (
                <li>
                  <button 
                    onClick={() => {
                      setCurrentView('admin-login');
                      window.scrollTo(0, 0);
                    }}
                    className="hover:underline px-2 py-1 rounded transition hover:bg-pink-600"
                  >
                    Admin
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>

      {/* Logo Header - Now with extra large 320px × 320px logo */}
      <div className="logo-holder w-full flex flex-col items-center justify-center py-8" style={{ backgroundColor: '#fc94ad' }}>
        {siteSettings.logo_url ? (
          <img
            src={siteSettings.logo_url}
            alt="Melita Bakes"
            className="w-80 h-80 object-contain mb-4 rounded-full border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-80 h-80 bg-white flex items-center justify-center rounded-full border-4 border-white shadow-lg mb-4">
            <span className="text-gray-500 text-xl">No Logo</span>
          </div>
        )}
        <h1 className="text-4xl font-bold text-white">Melita Bakes</h1>
      </div>

      {/* Main content */}
      <main className="container mx-auto p-4">
        {currentView === 'home' && (
          <>
            {/* Hero Section */}
            <section id="home" className="py-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Delicious Cakes by Melita</h2>
              <p className="text-xl max-w-2xl mx-auto mb-8">Crafting beautiful and tasty cakes since 2023.</p>
              <img src="https://placehold.co/600x400" alt="Melita Bakes" className="mx-auto rounded-lg shadow-lg w-full max-w-3xl" />
            </section>

            {/* Cake Carousel */}
            <section className="py-12">
              <h3 className="text-2xl font-bold mb-6 text-center">Our Cakes</h3>
              <div className="overflow-x-scroll pb-4 hide-scrollbar">
                <div className="flex space-x-4">
                  {cakes.map((cake) => (
                    <div key={cake.id} className="w-72 h-96 bg-neutral-800 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                      <div className="relative w-full h-64">
                        <img 
                          src={cake.image_url || 'https://placehold.co/300x300'} 
                          alt={cake.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-lg">{cake.name}</h4>
                        <p className="text-gray-300">₹{cake.price}</p>
                        <p className="text-sm text-gray-400 mt-2">{cake.description}</p>
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
                  <div key={testimonial.id} className="bg-neutral-800 p-6 rounded-lg shadow-md">
                    <p className="italic mb-4 text-gray-300">"{testimonial.comment}"</p>
                    <p className="font-semibold text-gray-100">{testimonial.name}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Business Hours */}
            <section id="hours" className="py-12">
              <h3 className="text-2xl font-bold mb-6 text-center">Business Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hours.map((hour) => (
                  <div key={hour.id} className="bg-neutral-800 p-6 rounded-lg shadow-md border border-gray-700">
                    <h4 className="font-bold text-lg text-gray-100">{hour.day}</h4>
                    <p className="text-gray-300">{hour.hours}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Info */}
            <section id="contact" className="py-12">
              <h3 className="text-2xl font-bold mb-6 text-center">Contact Us</h3>
              <div className="max-w-2xl mx-auto bg-neutral-800 p-6 rounded-lg shadow-md border border-gray-700">
                <p className="mb-2 text-gray-300"><strong className="text-gray-100">Phone:</strong> {contactInfo?.phone || 'N/A'}</p>
                <p className="mb-2 text-gray-300"><strong className="text-gray-100">Instagram:</strong> {contactInfo?.instagram ? (
                  <a href={`https://instagram.com/${contactInfo.instagram}`} target="_blank" rel="noopener noreferrer" className="underline">
                    @{contactInfo.instagram}
                  </a>
                ) : 'N/A'}</p>
                <p className="text-gray-300"><strong className="text-gray-100">Address:</strong> {contactInfo?.address || 'N/A'}</p>
              </div>
            </section>
          </>
        )}

        {currentView === 'admin-login' && (
          <section className="py-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Admin Login</h2>
            <div className="max-w-md mx-auto bg-neutral-800 p-6 rounded-lg shadow-md border border-gray-700">
              <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }}>
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                    Email
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    value={adminEmail} 
                    onChange={(e) => setAdminEmail(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                    required 
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                    Password
                  </label>
                  <input 
                    type="password" 
                    id="password" 
                    value={adminPassword} 
                    onChange={(e) => setAdminPassword(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
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

            {/* Change Site Logo */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Change Site Logo</h3>
              <div className="bg-neutral-800 p-6 rounded-lg shadow-md border border-gray-700 mb-6 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setLogoFile(e.target.files?.[0])}
                    className="border p-2 rounded w-full bg-neutral-900 text-gray-100"
                    disabled={logoUploading}
                  />
                  <button
                    onClick={handleLogoUpload}
                    className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold px-4 py-2 rounded disabled:opacity-50"
                    disabled={logoUploading || !logoFile}
                  >
                    {logoUploading ? 'Uploading...' : 'Upload Logo'}
                  </button>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-64 h-64 rounded-full border-4 border-white shadow-md flex items-center justify-center" style={{ backgroundColor: '#fc94ad' }}>
                    {siteSettings.logo_url ? (
                      <img
                        src={siteSettings.logo_url}
                        alt="Current Logo"
                        className="w-full h-full object-contain rounded-full"
                      />
                    ) : (
                      <span className="text-gray-500">No Logo</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-300">Current Logo Preview</p>
                </div>
              </div>
            </section>

            {/* Manage Cakes */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Manage Cakes</h3>
              <div className="bg-neutral-800 p-6 rounded-lg shadow-md border border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-2 text-gray-100">{editingCakeId ? 'Edit Cake' : 'Add New Cake'}</h4>
                    <form onSubmit={(e) => { e.preventDefault(); editingCakeId ? editCake() : addCake(); }}>
                      <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="name">
                          Name
                        </label>
                        <input 
                          type="text" 
                          id="name" 
                          value={newCake.name} 
                          onChange={(e) => setNewCake({...newCake, name: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          required 
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="price">
                          Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-300">₹</span>
                          <input 
                            type="number" 
                            id="price" 
                            value={newCake.price} 
                            onChange={(e) => setNewCake({...newCake, price: e.target.value})} 
                            className="w-full pl-8 px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                            required 
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="description">
                          Description
                        </label>
                        <textarea 
                          id="description" 
                          value={newCake.description} 
                          onChange={(e) => setNewCake({...newCake, description: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          rows="3" 
                          required 
                        ></textarea>
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="image">
                          {editingCakeId ? 'New Image (optional)' : 'Image (required)'}
                        </label>
                        <input 
                          type="file" 
                          id="image" 
                          accept="image/*" 
                          onChange={(e) => setCakeImageFile(e.target.files?.[0])} 
                          className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          required={!editingCakeId}
                        />
                        {editingCakeId && newCake.image_url && (
                          <p className="text-xs text-gray-400 mt-1">Current image will be kept if no new image is selected</p>
                        )}
                      </div>
                      <div className="flex space-x-4">
                        <button 
                          type="submit" 
                          className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                          {editingCakeId ? 'Update Cake' : 'Add Cake'}
                        </button>
                        {editingCakeId && (
                          <button 
                            type="button" 
                            onClick={() => {
                              setEditingCakeId(null);
                              setNewCake({ name: '', price: '', description: '', image_url: '' });
                              setCakeImageFile(null);
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2 text-gray-100">Current Cakes ({cakes.length})</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-neutral-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-neutral-800 divide-y divide-gray-700">
                          {cakes.map((cake) => (
                            <tr key={cake.id} className="hover:bg-neutral-700">
                              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{cake.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-300">₹{cake.price}</td>
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
                                  className="text-blue-400 hover:text-blue-300 mr-4"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => deleteCake(cake.id)} 
                                  className="text-red-400 hover:text-red-300"
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
              <div className="bg-neutral-800 p-6 rounded-lg shadow-md border border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-2 text-gray-100">{editingHourId ? 'Edit Hour' : 'Add New Hour'}</h4>
                    <form onSubmit={(e) => { e.preventDefault(); editingHourId ? editBusinessHour(editingHourId) : addBusinessHour(); }}>
                      <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="day">
                          Day
                        </label>
                        <input 
                          type="text" 
                          id="day" 
                          value={newHour.day} 
                          onChange={(e) => setNewHour({...newHour, day: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          required 
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="hours">
                          Hours
                        </label>
                        <input 
                          type="text" 
                          id="hours" 
                          value={newHour.hours} 
                          onChange={(e) => setNewHour({...newHour, hours: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          required 
                        />
                      </div>
                      <div className="flex space-x-4">
                        <button 
                          type="submit" 
                          className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                          {editingHourId ? 'Update Hour' : 'Add Hour'}
                        </button>
                        {editingHourId && (
                          <button 
                            type="button" 
                            onClick={() => {
                              setEditingHourId(null);
                              setNewHour({ day: '', hours: '' });
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2 text-gray-100">Current Hours ({hours.length})</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-neutral-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Day</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hours</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-neutral-800 divide-y divide-gray-700">
                          {hours.map((hour) => (
                            <tr key={hour.id} className="hover:bg-neutral-700">
                              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{hour.day}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{hour.hours}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button 
                                  onClick={() => {
                                    setNewHour(hour);
                                    setEditingHourId(hour.id);
                                  }} 
                                  className="text-blue-400 hover:text-blue-300 mr-4"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => deleteBusinessHour(hour.id)} 
                                  className="text-red-400 hover:text-red-300"
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
              <div className="bg-neutral-800 p-6 rounded-lg shadow-md border border-gray-700 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-2 text-gray-100">{editingTestimonialId ? 'Edit Testimonial' : 'Add New Testimonial'}</h4>
                    <form onSubmit={(e) => { e.preventDefault(); editingTestimonialId ? editTestimonial(editingTestimonialId) : addTestimonial(); }}>
                      <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="name">
                          Name
                        </label>
                        <input 
                          type="text" 
                          id="name" 
                          value={newTestimonial.name} 
                          onChange={(e) => setNewTestimonial({...newTestimonial, name: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          required 
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="comment">
                          Comment
                        </label>
                        <textarea 
                          id="comment" 
                          value={newTestimonial.comment} 
                          onChange={(e) => setNewTestimonial({...newTestimonial, comment: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                          rows="3" 
                          required 
                        ></textarea>
                      </div>
                      <div className="flex space-x-4">
                        <button 
                          type="submit" 
                          className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                          {editingTestimonialId ? 'Update Testimonial' : 'Add Testimonial'}
                        </button>
                        {editingTestimonialId && (
                          <button 
                            type="button" 
                            onClick={() => {
                              setEditingTestimonialId(null);
                              setNewTestimonial({ name: '', comment: '' });
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2 text-gray-100">Current Testimonials ({testimonials.length})</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-neutral-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Comment</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-neutral-800 divide-y divide-gray-700">
                          {testimonials.map((testimonial) => (
                            <tr key={testimonial.id} className="hover:bg-neutral-700">
                              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{testimonial.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-300 max-w-xs truncate">{testimonial.comment}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button 
                                  onClick={() => {
                                    setNewTestimonial(testimonial);
                                    setEditingTestimonialId(testimonial.id);
                                  }} 
                                  className="text-blue-400 hover:text-blue-300 mr-4"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => deleteTestimonial(testimonial.id)} 
                                  className="text-red-400 hover:text-red-300"
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
              <div className="bg-neutral-800 p-6 rounded-lg shadow-md border border-gray-700 mb-6">
                <form onSubmit={(e) => { e.preventDefault(); updateContactInfo(); }}>
                  <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="phone">
                      Phone
                    </label>
                    <input 
                      type="text" 
                      id="phone" 
                      value={contactInfo?.phone || ''} 
                      onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                      required 
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="instagram">
                      Instagram Handle (without @)
                    </label>
                    <input 
                      type="text" 
                      id="instagram" 
                      value={contactInfo?.instagram || ''} 
                      onChange={(e) => setContactInfo({...contactInfo, instagram: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                      required 
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="address">
                      Address
                    </label>
                    <textarea 
                      id="address" 
                      value={contactInfo?.address || ''} 
                      onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-600 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                      rows="3" 
                      required 
                    ></textarea>
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
              <h3 className="text-2xl font-bold mb-4">Registered Users ({users.length})</h3>
              <div className="bg-neutral-800 p-6 rounded-lg shadow-md border border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-neutral-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="bg-neutral-800 divide-y divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-neutral-700">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                            {new Date(user.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
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
      <footer className="bg-neutral-800 text-gray-300 p-6 mt-12">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} Melita Bakes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
