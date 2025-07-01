import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import './App.css';

function App() {
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [cakes, setCakes] = useState([]);
  const [hours, setHours] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [users, setUsers] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ logo_url: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Admin states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [newCake, setNewCake] = useState({ name: '', price: '', description: '' });
  const [editingCakeId, setEditingCakeId] = useState(null);
  const [cakeImageFile, setCakeImageFile] = useState(null);
  const [newHour, setNewHour] = useState({ day: '', hours: '' });
  const [newTestimonial, setNewTestimonial] = useState({ name: '', comment: '' });

  // Load data from Supabase
  useEffect(() => {
    loadInitialData();
  }, [isAdminLoggedIn]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadCakes(),
        loadHours(),
        loadTestimonials(),
        loadContactInfo(),
        loadSiteSettings()
      ]);
      if (isAdminLoggedIn) {
        await loadUsers();
      }
    } catch (error) {
      alert('Failed to load data');
      console.error(error);
    }
  };

  // Data loading functions
  const loadSiteSettings = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('logo_url')
      .eq('id', 1)
      .single();
    if (error) throw error;
    setSiteSettings(data || { logo_url: '' });
  };

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

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      // Update DB
      const { error: updateError } = await supabase
        .from('site_settings')
        .update({ logo_url: publicUrl })
        .eq('id', 1);

      if (updateError) throw updateError;

      setSiteSettings({ logo_url: publicUrl });
      alert('Logo updated successfully!');
    } catch (error) {
      alert('Failed to upload logo');
      console.error(error);
    } finally {
      setLogoUploading(false);
    }
  };

  const loadCakes = async () => {
    const { data, error } = await supabase.from('cakes').select('*');
    if (error) throw error;
    setCakes(data);
  };

  const loadHours = async () => {
    const { data, error } = await supabase.from('hours').select('*');
    if (error) throw error;
    setHours(data);
  };

  const loadTestimonials = async () => {
    const { data, error } = await supabase.from('testimonials').select('*');
    if (error) throw error;
    setTestimonials(data);
  };

  const loadContactInfo = async () => {
    const { data, error } = await supabase.from('contact').select('*').single();
    if (error) throw error;
    setContactInfo(data);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    setUsers(data);
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
    } catch (error) {
      alert('Login failed');
      console.error(error);
    }
  };

  // Cake management
  const addCake = async () => {
    let imageUrl = '';
    if (cakeImageFile) {
      const fileExt = cakeImageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('cakes-images')
        .upload(`public/${fileName}`, cakeImageFile);

      if (uploadError) throw uploadError;
      imageUrl = `https://${supabaseUrl.split('//')[1]}/storage/v1/object/public/cakes-images/${fileName}`;
    }

    const { error } = await supabase
      .from('cakes')
      .insert([{ ...newCake, image_url: imageUrl }]);

    if (error) throw error;
    
    setNewCake({ name: '', price: '', description: '' });
    setCakeImageFile(null);
    loadCakes();
  };

  const editCake = async () => {
    let imageUrl = newCake.image_url;
    if (cakeImageFile) {
      const fileExt = cakeImageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('cakes-images')
        .upload(`public/${fileName}`, cakeImageFile);

      if (uploadError) throw uploadError;
      imageUrl = `https://${supabaseUrl.split('//')[1]}/storage/v1/object/public/cakes-images/${fileName}`;
    }

    const { error } = await supabase
      .from('cakes')
      .update({ ...newCake, image_url: imageUrl })
      .eq('id', editingCakeId);

    if (error) throw error;
    
    setEditingCakeId(null);
    setNewCake({ name: '', price: '', description: '' });
    setCakeImageFile(null);
    loadCakes();
  };

  const deleteCake = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    const { error } = await supabase.from('cakes').delete().eq('id', id);
    if (error) throw error;
    loadCakes();
  };

  // Hours management
  const addBusinessHour = async () => {
    const { error } = await supabase.from('hours').insert([{ ...newHour }]);
    if (error) throw error;
    setNewHour({ day: '', hours: '' });
    loadHours();
  };

  const deleteBusinessHour = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    const { error } = await supabase.from('hours').delete().eq('id', id);
    if (error) throw error;
    loadHours();
  };

  // Testimonials management
  const addTestimonial = async () => {
    const { error } = await supabase.from('testimonials').insert([{ ...newTestimonial }]);
    if (error) throw error;
    setNewTestimonial({ name: '', comment: '' });
    loadTestimonials();
  };

  const deleteTestimonial = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) throw error;
    loadTestimonials();
  };

  // Contact management
  const updateContactInfo = async () => {
    const { error } = await supabase.from('contact').upsert(contactInfo);
    if (error) throw error;
    loadContactInfo();
  };

  // Navigation helper
  const navigateToSection = (sectionId) => {
    setCurrentView('home');
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100">
      {/* Header */}
      <header className="bg-pink-500 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigateToSection('home')}>
            Melita Bakes
          </h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <button onClick={() => navigateToSection('home')} className="hover:underline">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigateToSection('about')} className="hover:underline">
                  About
                </button>
              </li>
              <li>
                <button onClick={() => navigateToSection('contact')} className="hover:underline">
                  Contact
                </button>
              </li>
              {!isAdminLoggedIn && (
                <li>
                  <button onClick={() => setCurrentView('admin-login')} className="hover:underline">
                    Admin
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>

      {/* Logo Header */}
      <div className="logo-holder flex flex-col items-center justify-center py-4">
        {siteSettings.logo_url ? (
          <img
            src={siteSettings.logo_url}
            alt="Melita Bakes"
            className="w-24 h-24 object-contain mb-2"
          />
        ) : (
          <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded mb-2">
            <span className="text-gray-500">No Logo</span>
          </div>
        )}
        <h1 className="text-2xl font-bold">Melita Bakes</h1>
      </div>

      {/* Main content */}
      <main className="container mx-auto p-4">
        {/* Home View */}
        {currentView === 'home' && (
          <>
            <section id="home" className="py-12 text-center">
              <h2 className="text-4xl font-bold mb-4">Delicious Cakes by Melita</h2>
              <p className="text-xl max-w-2xl mx-auto mb-8">Crafting beautiful and tasty cakes since 2023.</p>
              <img src="https://placehold.co/600x400" alt="Melita Bakes" className="mx-auto rounded-lg shadow-lg" />
            </section>

            {/* Cakes Section */}
            <section className="py-12">
              <h3 className="text-2xl font-bold mb-6 text-center">Our Cakes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cakes.map((cake) => (
                  <div key={cake.id} className="bg-neutral-800 p-4 rounded-lg shadow-md">
                    <img src={cake.image_url} alt={cake.name} className="w-full h-48 object-cover rounded mb-4" />
                    <h4 className="font-bold text-lg">{cake.name}</h4>
                    <p className="text-gray-300">₹{cake.price}</p>
                    <p className="text-sm text-gray-400 mt-2">{cake.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Other sections... */}
          </>
        )}

        {/* Admin Login */}
        {currentView === 'admin-login' && (
          <section className="py-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Admin Login</h2>
            <div className="max-w-md mx-auto bg-neutral-800 p-6 rounded-lg shadow-md">
              <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }}>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full p-2 rounded bg-neutral-700 border border-gray-600"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full p-2 rounded bg-neutral-700 border border-gray-600"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded"
                >
                  Login
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Admin Dashboard */}
        {isAdminLoggedIn && currentView === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h2>

            {/* Logo Management */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Change Site Logo</h3>
              <div className="bg-neutral-800 p-6 rounded-lg shadow-md mb-6">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0])}
                  className="mb-4"
                />
                <button
                  onClick={handleLogoUpload}
                  disabled={logoUploading}
                  className="bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded"
                >
                  {logoUploading ? 'Uploading...' : 'Upload Logo'}
                </button>
              </div>
            </section>

            {/* Cake Management */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Manage Cakes</h3>
              <div className="bg-neutral-800 p-6 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-2">Add/Edit Cake</h4>
                    <form onSubmit={(e) => { e.preventDefault(); editingCakeId ? editCake() : addCake(); }}>
                      <input
                        type="text"
                        placeholder="Name"
                        value={newCake.name}
                        onChange={(e) => setNewCake({...newCake, name: e.target.value})}
                        className="w-full p-2 mb-4 rounded bg-neutral-700 border border-gray-600"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={newCake.price}
                        onChange={(e) => setNewCake({...newCake, price: e.target.value})}
                        className="w-full p-2 mb-4 rounded bg-neutral-700 border border-gray-600"
                        required
                      />
                      <textarea
                        placeholder="Description"
                        value={newCake.description}
                        onChange={(e) => setNewCake({...newCake, description: e.target.value})}
                        className="w-full p-2 mb-4 rounded bg-neutral-700 border border-gray-600"
                        required
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCakeImageFile(e.target.files?.[0])}
                        className="mb-4"
                      />
                      <button
                        type="submit"
                        className="bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded"
                      >
                        {editingCakeId ? 'Update Cake' : 'Add Cake'}
                      </button>
                    </form>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Current Cakes</h4>
                    <div className="space-y-4">
                      {cakes.map((cake) => (
                        <div key={cake.id} className="flex justify-between items-center p-3 bg-neutral-700 rounded">
                          <span>{cake.name}</span>
                          <div>
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
                              className="text-blue-400 hover:text-blue-300 mr-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteCake(cake.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Other management sections... */}
          </div>
        )}
      </main>

      <footer className="bg-neutral-800 text-gray-300 p-6 mt-12">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} Melita Bakes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
