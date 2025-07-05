import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
    if (error) {
      console.error('Error loading site settings:', error);
      toast.error('Failed to load site settings');
    } else {
      setSiteSettings(data || { logo_url: '' });
    }
  };

  // Load cakes
  const loadCakes = async () => {
    const { data, error } = await supabase
      .from('cakes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load cakes: ' + error.message);
      console.error(error);
    } else {
      setCakes(data || []);
    }
  };

  // Add new cake
  const addCake = async () => {
    if (!cakeImageFile) {
      toast.error('Please upload an image for the cake');
      return;
    }

    try {
      toast.info('Uploading cake image...');
      
      // Upload image
      const fileExt = cakeImageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cakes-images')
        .upload(filePath, cakeImageFile);
      
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('cakes-images')
        .getPublicUrl(filePath);

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
      toast.success('Cake added successfully!');
      loadCakes();
    } catch (err) {
      console.error('Error adding cake:', err);
      toast.error('Error adding cake: ' + err.message);
    }
  };

  // Edit cake
  const editCake = async () => {
    try {
      let imageUrl = newCake.image_url;

      if (cakeImageFile) {
        toast.info('Uploading new cake image...');
        
        // Upload new image
        const fileExt = cakeImageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cakes-images')
          .upload(filePath, cakeImageFile);
        if (uploadError) throw uploadError;

        // Get new public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('cakes-images')
          .getPublicUrl(filePath);

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
      toast.success('Cake updated successfully!');
      loadCakes();
    } catch (err) {
      console.error('Error updating cake:', err);
      toast.error('Error updating cake: ' + err.message);
    }
  };

  // Delete cake
  const deleteCake = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cake?')) return;
    try {
      const { error } = await supabase.from('cakes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Cake deleted successfully!');
      loadCakes();
    } catch (err) {
      console.error('Error deleting cake:', err);
      toast.error('Error deleting cake: ' + err.message);
    }
  };

  // ... (keep all other existing functions exactly as they were)

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

      {/* Logo Header */}
      <div className="logo-holder w-full flex flex-col items-center justify-center py-8" style={{ backgroundColor: '#fc94ad' }}>
        {siteSettings.logo_url ? (
          <img
            src={siteSettings.logo_url}
            alt="Melita Bakes"
            style={{ width: "420px", height: "420px" }}
            className="object-contain mb-4 rounded-full border-4 border-white shadow-lg"
          />
        ) : (
          <div style={{ width: "420px", height: "420px" }} className="bg-white flex items-center justify-center rounded-full border-4 border-white shadow-lg mb-4">
            <span className="text-gray-500 text-xl">No Logo</span>
          </div>
        )}
        <h1 className="text-5xl font-bold text-white">Melita Bakes</h1>
      </div>

      {/* Main content */}
      <main className="container mx-auto p-4">
        {currentView === 'home' && (
          <>
            {/* Home page content remains exactly the same */}
            {/* ... */}
          </>
        )}

        {currentView === 'admin-login' && (
          <section className="py-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Admin Login</h2>
            <div className="max-w-md mx-auto bg-neutral-800 p-6 rounded-lg shadow-md border border-gray-700">
              <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }}>
                {/* Login form remains exactly the same */}
                {/* ... */}
              </form>
            </div>
          </section>
        )}

        {isAdminLoggedIn && currentView === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h2>

            {/* Change Site Logo section remains exactly the same */}
            {/* ... */}

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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCakeImageFile(file);
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600"
                          required={!editingCakeId}
                        />
                        {cakeImageFile && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-400">Selected: {cakeImageFile.name}</p>
                            <img 
                              src={URL.createObjectURL(cakeImageFile)} 
                              alt="Preview" 
                              className="mt-2 h-32 object-cover rounded"
                            />
                          </div>
                        )}
                        {editingCakeId && newCake.image_url && !cakeImageFile && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-400">Current image:</p>
                            <img 
                              src={newCake.image_url} 
                              alt="Current" 
                              className="mt-2 h-32 object-cover rounded"
                            />
                          </div>
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

            {/* All other dashboard sections remain exactly the same */}
            {/* ... */}
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
