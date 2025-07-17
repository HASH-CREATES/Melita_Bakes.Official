import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /* --- Data states --- */
  const [cakes, setCakes] = useState([]);
  const [hours, setHours] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [contact, setContact] = useState({});
  const [logo, setLogo] = useState('');

  /* --- Form states --- */
  const [cakeForm, setCakeForm] = useState({ name: '', price: '', description: '' });
  const [cakeImageFile, setCakeImageFile] = useState(null);
  const [hourForm, setHourForm] = useState({ day: '', hours: '' });
  const [testimonialForm, setTestimonialForm] = useState({ name: '', comment: '' });
  const [contactForm, setContactForm] = useState({ phone: '', instagram: '', address: '' });
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    if (isLoggedIn) loadAll();
  }, [isLoggedIn]);

  const login = async () => {
    const { data } = await supabase
      .from('admins')
      .select('*')
      .eq('admin_email', email.trim())
      .eq('admin_password', password.trim())
      .single();
    if (data) {
      setIsLoggedIn(true);
      toast.success('Logged in');
    } else toast.error('Invalid login');
  };

  const loadAll = async () => {
    const [c, h, t, con, l] = await Promise.all([
      supabase.from('cakes').select('*'),
      supabase.from('hours').select('*'),
      supabase.from('testimonials').select('*'),
      supabase.from('contact').select('*').single(),
      supabase.from('site_settings').select('logo_url').single()
    ]);
    setCakes(c.data || []);
    setHours(h.data || []);
    setTestimonials(t.data || []);
    setContact(con.data || {});
    setContactForm(con.data || {});
    setLogo(l.data?.logo_url || '');
  };

  /* ---------- CRUD helpers ---------- */
  const uploadFile = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('cakes-images').upload(`public/${fileName}`, file);
    if (error) throw error;
    const { data } = supabase.storage.from('cakes-images').getPublicUrl(`public/${fileName}`);
    return data.publicUrl;
  };

  const addCake = async (e) => {
    e.preventDefault();
    if (!cakeImageFile) return toast.error('Image required');
    const toastId = toast.loading('Uploading…');
    try {
      const imageUrl = await uploadFile(cakeImageFile);
      await supabase.from('cakes').insert({ ...cakeForm, price: parseFloat(cakeForm.price), image_url: imageUrl });
      toast.update(toastId, { render: 'Cake added', type: 'success', isLoading: false, autoClose: 2000 });
      setCakeForm({ name: '', price: '', description: '' });
      setCakeImageFile(null);
      loadAll();
    } catch (err) {
      toast.update(toastId, { render: err.message, type: 'error', isLoading: false });
    }
  };

  const deleteCake = async (id) => {
    await supabase.from('cakes').delete().eq('id', id);
    toast.success('Deleted');
    loadAll();
  };

  const addHour = async (e) => {
    e.preventDefault();
    await supabase.from('hours').insert(hourForm);
    setHourForm({ day: '', hours: '' });
    toast.success('Hour added');
    loadAll();
  };
  const deleteHour = async (id) => {
    await supabase.from('hours').delete().eq('id', id);
    toast.success('Deleted');
    loadAll();
  };

  const addTestimonial = async (e) => {
    e.preventDefault();
    await supabase.from('testimonials').insert(testimonialForm);
    setTestimonialForm({ name: '', comment: '' });
    toast.success('Testimonial added');
    loadAll();
  };
  const deleteTestimonial = async (id) => {
    await supabase.from('testimonials').delete().eq('id', id);
    toast.success('Deleted');
    loadAll();
  };

  const saveContact = async (e) => {
    e.preventDefault();
    await supabase.from('contact').upsert({ ...contactForm, id: 1 });
    toast.success('Contact saved');
    loadAll();
  };

  const uploadLogo = async () => {
    if (!logoFile) return;
    const url = await uploadFile(logoFile);
    await supabase.from('site_settings').upsert({ id: 1, logo_url: url });
    toast.success('Logo updated');
    loadAll();
  };

  if (!isLoggedIn)
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <form onSubmit={(e) => { e.preventDefault(); login(); }} className="bg-neutral-800 p-8 rounded shadow space-y-4 w-full max-sm">
          <h2 className="text-2xl font-bold text-white">Admin Login</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2 rounded" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-2 rounded" />
          <button className="w-full bg-pink-500 text-white p-2 rounded">Login</button>
        </form>
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4">
      <ToastContainer theme="dark" />
      <h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>

      {/* Logo */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">Change Logo</h2>
        <div className="flex items-center gap-4">
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
          <button onClick={uploadLogo} className="bg-pink-500 px-4 py-2 rounded">Upload</button>
          {logo && <img src={logo} alt="logo" className="w-20 h-20 rounded-full object-cover" />}
        </div>
      </section>

      {/* Cakes */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">Manage Cakes</h2>
        <form onSubmit={addCake} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input placeholder="Name" value={cakeForm.name} onChange={(e) => setCakeForm({ ...cakeForm, name: e.target.value })} required className="p-2 rounded bg-neutral-800" />
          <input type="number" placeholder="Price (₹)" value={cakeForm.price} onChange={(e) => setCakeForm({ ...cakeForm, price: e.target.value })} required className="p-2 rounded bg-neutral-800" />
          <textarea placeholder="Description" value={cakeForm.description} onChange={(e) => setCakeForm({ ...cakeForm, description: e.target.value })} required className="p-2 rounded bg-neutral-800 md:col-span-2" />
          <input type="file" accept="image/*" onChange={(e) => setCakeImageFile(e.target.files[0])} required className="md:col-span-2" />
          <button type="submit" className="bg-pink-500 p-2 rounded md:col-span-2">Add Cake</button>
        </form>
        <div className="space-y-2">
          {cakes.map((c) => (
            <div key={c.id} className="flex justify-between items-center bg-neutral-800 p-2 rounded">
              <span>{c.name} – ₹{c.price}</span>
              <button onClick={() => deleteCake(c.id)} className="text-red-400">Delete</button>
            </div>
          ))}
        </div>
      </section>

      {/* Hours */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">Business Hours</h2>
        <form onSubmit={addHour} className="flex gap-2 mb-2">
          <input placeholder="Day" value={hourForm.day} onChange={(e) => setHourForm({ ...hourForm, day: e.target.value })} required className="p-2 rounded bg-neutral-800 flex-1" />
          <input placeholder="Hours" value={hourForm.hours} onChange={(e) => setHourForm({ ...hourForm, hours: e.target.value })} required className="p-2 rounded bg-neutral-800 flex-1" />
          <button type="submit" className="bg-pink-500 p-2 rounded">Add</button>
        </form>
        <div className="space-y-1">
          {hours.map((h) => (
            <div key={h.id} className="flex justify-between items-center bg-neutral-800 p-2 rounded">
              <span>{h.day} – {h.hours}</span>
              <button onClick={() => deleteHour(h.id)} className="text-red-400">Delete</button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">Testimonials</h2>
        <form onSubmit={addTestimonial} className="space-y-2 mb-2">
          <input placeholder="Name" value={testimonialForm.name} onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })} required className="p-2 rounded bg-neutral-800 w-full" />
          <textarea placeholder="Comment" value={testimonialForm.comment} onChange={(e) => setTestimonialForm({ ...testimonialForm, comment: e.target.value })} required className="p-2 rounded bg-neutral-800 w-full" />
          <button type="submit" className="bg-pink-500 p-2 rounded">Add</button>
        </form>
        <div className="space-y-1">
          {testimonials.map((t) => (
            <div key={t.id} className="flex justify-between items-center bg-neutral-800 p-2 rounded">
              <span>{t.name}: {t.comment}</span>
              <button onClick={() => deleteTestimonial(t.id)} className="text-red-400">Delete</button>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-xl font-bold mb-2">Contact Info</h2>
        <form onSubmit={saveContact} className="space-y-2">
          <input placeholder="Phone" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} required className="p-2 rounded bg-neutral-800 w-full" />
          <input placeholder="Instagram handle (no @)" value={contactForm.instagram} onChange={(e) => setContactForm({ ...contactForm, instagram: e.target.value })} required className="p-2 rounded bg-neutral-800 w-full" />
          <textarea placeholder="Address" value={contactForm.address} onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })} required className="p-2 rounded bg-neutral-800 w-full" />
          <button type="submit" className="bg-pink-500 p-2 rounded">Save</button>
        </form>
      </section>
    </div>
  );
};

export default AdminPanel;
