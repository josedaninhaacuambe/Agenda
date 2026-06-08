import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { Target, Bell, Mic, Shield } from 'lucide-react';
import { useGoogleAuth, GoogleUser } from '../contexts/GoogleAuthContext';

interface GoogleJwt {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

export default function LoginPage() {
  const { signIn } = useGoogleAuth();

  const handleSuccess = (response: { credential?: string }) => {
    if (!response.credential) return;
    const payload = jwtDecode<GoogleJwt>(response.credential);
    const user: GoogleUser = {
      sub:     payload.sub,
      name:    payload.name,
      email:   payload.email,
      picture: payload.picture,
    };
    signIn(user);
  };

  const features = [
    { icon: <Target className="w-5 h-5" />, label: 'Matriz de Eisenhower', color: 'text-indigo-600 bg-indigo-50' },
    { icon: <Bell   className="w-5 h-5" />, label: 'Lembretes a cada 15 min', color: 'text-amber-600 bg-amber-50' },
    { icon: <Mic    className="w-5 h-5" />, label: 'Entrada por voz',       color: 'text-emerald-600 bg-emerald-50' },
    { icon: <Shield className="w-5 h-5" />, label: 'Dados privados',        color: 'text-rose-600 bg-rose-50' },
  ];

  const modes = [
    { emoji: '📅', label: 'Diário',  bg: 'bg-sky-50 text-sky-700',       border: 'border-sky-200' },
    { emoji: '📆', label: 'Semanal', bg: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-200' },
    { emoji: '🗓️', label: 'Mensal',  bg: 'bg-purple-50 text-purple-700', border: 'border-purple-200' },
    { emoji: '📊', label: 'Anual',   bg: 'bg-rose-50 text-rose-700',     border: 'border-rose-200' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200 mx-auto mb-4"
          >
            <Target className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Agenda Pro</h1>
          <p className="text-slate-500 mt-1 text-sm">Organização pessoal com a Matriz de Eisenhower</p>
        </div>

        {/* Planning modes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide mb-3">Planifique o seu tempo</p>
          <div className="grid grid-cols-4 gap-2">
            {modes.map((m) => (
              <div key={m.label} className={`rounded-xl border ${m.border} ${m.bg} py-2.5 text-center`}>
                <div className="text-xl mb-1">{m.emoji}</div>
                <p className="text-xs font-bold">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
              <div className={`w-8 h-8 ${f.color} rounded-lg flex items-center justify-center flex-shrink-0`}>{f.icon}</div>
              <p className="text-slate-600 text-xs font-medium leading-tight">{f.label}</p>
            </div>
          ))}
        </div>

        {/* Google sign-in */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.error('Erro ao entrar com Google')}
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        <p className="text-center text-slate-400 text-xs mt-4 leading-relaxed">
          Os seus dados ficam associados ao seu e-mail Google.<br />
          Privado, seguro e acessível em qualquer dispositivo.
        </p>
      </motion.div>
    </div>
  );
}
