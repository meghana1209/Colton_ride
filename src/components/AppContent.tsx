import { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthProvider';
import { Car, MapPin, Search, Navigation, Settings, ShieldCheck, History, CreditCard, LogOut, LayoutDashboard, UserCircle } from 'lucide-react';
import { Button } from './ui/button';
import { estimateFare } from '../services/geminiService';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

export default function App() {
  const { user, profile, loading, signIn, logout } = useAuth();
  const [mode, setMode] = useState<'rider' | 'driver' | 'admin'>('rider');

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-white font-bold text-2xl tracking-tighter"
        >
          COLTON RIDE
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-extrabold text-white tracking-tight"
          >
            Colton
          </motion.h1>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400"
          >
            Move with style. Fast, secure, and premium rides at your fingertips.
          </motion.p>
          <Button 
            onClick={signIn}
            className="w-full bg-white text-black hover:bg-zinc-200 h-14 text-lg font-bold rounded-2xl transition-all active:scale-[0.98]"
          >
            Get Started with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar for Desktop / Bottom bar for Mobile */}
      <nav className="w-full md:w-20 bg-zinc-900/50 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/10 p-2 md:p-6 flex md:flex-col items-center justify-around md:justify-start gap-8 z-50">
        <div className="hidden md:block mb-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Car className="text-black w-6 h-6" />
          </div>
        </div>
        
        <NavButton active={mode === 'rider'} onClick={() => setMode('rider')} icon={<Search />} label="Ride" />
        <NavButton active={mode === 'driver'} onClick={() => setMode('driver')} icon={<Navigation />} label="Drive" />
        {profile?.role === 'admin' && (
          <NavButton active={mode === 'admin'} onClick={() => setMode('admin')} icon={<LayoutDashboard />} label="Admin" />
        )}
        
        <div className="md:mt-auto flex md:flex-col gap-6 items-center">
          <NavButton onClick={() => {}} icon={<History />} label="History" />
          <NavButton onClick={logout} icon={<LogOut />} label="Exit" className="text-red-500" />
        </div>
      </nav>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        <header className="absolute top-4 left-4 right-4 h-14 z-40 flex items-center justify-between px-4">
           {/* Search Bar - only for Rider */}
           {mode === 'rider' && (
             <div className="w-full max-w-lg bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/10 h-12 flex items-center px-4 shadow-2xl">
                <Search className="w-5 h-5 text-zinc-500 mr-3" />
                <input placeholder="Where to?" className="bg-transparent border-none outline-none flex-1 text-sm font-medium" />
             </div>
           )}
        </header>

        <div className="flex-1">
          {mode === 'rider' && <RiderView />}
          {mode === 'driver' && <DriverView />}
          {mode === 'admin' && <AdminView />}
        </div>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, className = '' }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 group transition-colors ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'} ${className}`}
    >
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-white/10' : 'group-hover:bg-white/5'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider hidden md:block">{label}</span>
    </button>
  );
}

// --- VIEWS ---

function RiderView() {
  const [searching, setSearching] = useState(false);
  const [rideRequest, setRideRequest] = useState<any>(null);
  const [estimate, setEstimate] = useState<any>(null);

  const handleRequestRide = async () => {
    setSearching(true);
    const est = await estimateFare(5.2, 15);
    setEstimate(est);
    
    const docRef = await addDoc(collection(db, 'rides'), {
      riderId: user?.uid,
      fare: est.fare,
      status: 'pending',
      createdAt: serverTimestamp(),
      pickup: { address: 'Current Location', lat: 40.7128, lng: -74.0060 }
    });

    // Track the ride
    onSnapshot(doc(db, 'rides', docRef.id), (snapshot) => {
      setRideRequest({ id: snapshot.id, ...snapshot.data() });
    });
    
    setSearching(false);
  };

  return (
    <div className="h-full relative overflow-hidden">
      <MapContainer />
      
      <AnimatePresence>
        {!rideRequest && !estimate && (
          <motion.div 
            initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
            className="absolute bottom-6 left-6 right-6 p-6 bg-zinc-900 rounded-3xl border border-white/10 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-zinc-800 rounded-2xl p-4 flex items-center gap-3">
                <MapPin className="text-zinc-500 w-5 h-5" />
                <span className="text-sm font-medium text-zinc-300">My Location</span>
              </div>
              <div className="w-1 bg-zinc-700 h-8 rounded-full" />
              <div className="flex-1 bg-zinc-800 rounded-2xl p-4 flex items-center gap-3">
                <MapPin className="text-white w-5 h-5" />
                <span className="text-sm font-medium">Set Destination</span>
              </div>
            </div>

            <Button 
               onClick={handleRequestRide}
               disabled={searching}
               className="w-full bg-white text-black hover:bg-zinc-200 h-14 text-lg font-bold rounded-2xl transition-all active:scale-[0.98]"
            >
              {searching ? 'Finding you a driver...' : 'Request Colton Ride'}
            </Button>
          </motion.div>
        )}

        {rideRequest && (
          <motion.div 
            initial={{ y: 200 }} animate={{ y: 0 }}
            className="absolute bottom-6 left-6 right-6 p-6 bg-zinc-900 rounded-3xl border border-white/10 shadow-2xl space-y-4"
          >
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-bold uppercase tracking-tight">
                     {rideRequest.status === 'pending' ? 'Searching...' : 
                      rideRequest.status === 'accepted' ? 'Driver Arriving' :
                      rideRequest.status === 'active' ? 'Heading to destination' : 'Ride Completed'}
                   </h3>
                   <p className="text-sm text-zinc-500">Your Colton Ride is {rideRequest.status}</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                   <Car className="text-white" />
                </div>
             </div>
             {rideRequest.status === 'completed' && (
               <Button onClick={() => setRideRequest(null)} className="w-full bg-white text-black font-bold h-12 rounded-xl">Back to Home</Button>
             )}
          </motion.div>
        )}

        {estimate && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-3xl text-center space-y-4"
          >
            <ShieldCheck className="w-12 h-12 text-white mx-auto mb-2" />
            <h3 className="text-xl font-bold">Ride Estimated</h3>
            <div className="text-4xl font-black text-white">${estimate.fare.toFixed(2)}</div>
            <p className="text-zinc-400 text-sm">{estimate.explanation}</p>
            <Button onClick={() => setEstimate(null)} className="w-full h-12 bg-white text-black font-bold rounded-xl">Confirm Ride</Button>
            <button onClick={() => setEstimate(null)} className="text-zinc-500 text-sm font-medium hover:text-zinc-300">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DriverView() {
  const [online, setOnline] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!online) return;
    const q = query(collection(db, 'rides'), where('status', '==', 'pending'));
    return onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [online]);

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between bg-zinc-900 p-6 rounded-3xl border border-white/10">
        <div>
          <h2 className="text-2xl font-bold">Good Morning, Driver</h2>
          <p className="text-sm text-zinc-500">You've earned $142.50 today</p>
        </div>
        <button 
          onClick={() => setOnline(!online)}
          className={`h-11 px-6 rounded-full font-bold transition-all ${online ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500 text-black'}`}
        >
          {online ? 'Stop Working' : 'Go Online'}
        </button>
      </div>

      <div className="flex-1 overflow-auto space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-2">Incoming Requests</h3>
        {requests.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-zinc-600">
            <Car className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">No rides available nearby</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-zinc-900 p-6 rounded-3xl border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">${req.fare}</p>
                  <p className="text-xs text-zinc-500">Pickup: {req.pickup?.address || 'Downtown'}</p>
                </div>
                <div className="flex gap-2">
                  {req.status === 'pending' && (
                    <Button onClick={() => updateDoc(doc(db, 'rides', req.id), { status: 'accepted' })} className="bg-white text-black h-10 px-6 rounded-xl font-bold">Accept</Button>
                  )}
                  {req.status === 'accepted' && (
                    <Button onClick={() => updateDoc(doc(db, 'rides', req.id), { status: 'active' })} className="bg-blue-600 text-white h-10 px-6 rounded-xl font-bold">Start Trip</Button>
                  )}
                  {req.status === 'active' && (
                    <Button onClick={() => updateDoc(doc(db, 'rides', req.id), { status: 'completed' })} className="bg-green-600 text-white h-10 px-6 rounded-xl font-bold">Finish</Button>
                  )}
                </div>
              </div>
              <div className="text-[10px] uppercase font-black tracking-widest text-zinc-600">Status: {req.status}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AdminView() {
  return (
    <div className="h-full p-8 space-y-8 overflow-auto">
      <h2 className="text-3xl font-black tracking-tight">Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Revenue" value="$4,290.00" trend="+12%" />
        <StatCard label="Active Rides" value="24" trend="-2%" />
        <StatCard label="Registered Users" value="1,204" trend="+5%" />
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-bold">Recent Rides</h3>
        </div>
        <div className="p-6">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="pb-4">Rider</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              <Row name="Alex Johnson" status="Completed" amount="$12.50" />
              <Row name="Sarah Miller" status="Accepted" amount="$8.00" />
              <Row name="Michael Chen" status="Completed" amount="$24.50" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend }: any) {
  return (
    <div className="bg-zinc-900 p-6 rounded-3xl border border-white/10 space-y-2">
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-none">{label}</p>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-black">{value}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{trend}</span>
      </div>
    </div>
  );
}

function Row({ name, status, amount }: any) {
  return (
    <tr className="border-t border-white/5">
      <td className="py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs">
          {name[0]}
        </div>
        {name}
      </td>
      <td className="py-4">
        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
          {status}
        </span>
      </td>
      <td className="py-4 text-right">{amount}</td>
    </tr>
  );
}

function MapContainer() {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-full w-full bg-zinc-950 flex items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-zinc-950">
        <div className="max-w-md space-y-6">
           <MapPin className="w-12 h-12 text-white opacity-20 mx-auto" />
           <h2 className="text-2xl font-bold">Map Interaction Restricted</h2>
           <p className="text-zinc-500 text-sm">Please add <code className="bg-white/5 px-2 py-1 rounded">GOOGLE_MAPS_PLATFORM_KEY</code> to your AI Studio secrets to enable real-time tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full grayscale contrast-125 brightness-75">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={{ lat: 40.7128, lng: -74.0060 }}
          defaultZoom={13}
          mapId="dark_mode_uber"
          disableDefaultUI={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Simulated Driver Marker */}
          <AdvancedMarker position={{ lat: 40.7200, lng: -74.0100 }}>
             <div className="p-2 bg-black rounded-full border border-white/20 shadow-xl">
                <Car className="text-white w-4 h-4" />
             </div>
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </div>
  );
}
