import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { Target, Bell, Mic, Shield } from 'lucide-react';

export default function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  const features = [
    { icon: <Target className="w-5 h-5" />, label: 'Matriz de Eisenhower', color: 'text-indigo-600 bg-indigo-50' },
    { icon: <Bell className="w-5 h-5" />,   label: 'Lembretes a cada 15 min', color: 'text-amber-600 bg-amber-50' },
    { icon: <Mic className="w-5 h-5" />,    label: 'Entrada por voz', color: 'text-emerald-600 bg-emerald-50' },
    { icon: <Shield className="w-5 h-5" />, label: 'Dados privados', color: 'text-rose-600 bg-rose-50' },
  ];

  const modes = [
    { emoji: '📅', label: 'Diário',   bg: 'bg-sky-50    text-sky-700',    border: 'border-sky-200' },
    { emoji: '📆', label: 'Semanal',  bg: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-200' },
    { emoji: '🗓️', label: 'Mensal',   bg: 'bg-purple-50 text-purple-700', border: 'border-purple-200' },
    { emoji: '📊', label: 'Anual',    bg: 'bg-rose-50   text-rose-700',   border: 'border-rose-200' },
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

        {/* Google sign-in button */}
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(99,102,241,0.15)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => loginWithRedirect()}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-bold py-4 rounded-2xl shadow-sm transition-all text-base"
        >
          {/* Official Google G logo */}
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </motion.button>

        <p className="text-center text-slate-400 text-xs mt-4 leading-relaxed">
          Os seus dados ficam associados ao seu e-mail Google.<br/>
          Privado, seguro e acessível em qualquer dispositivo.
        </p>
      </motion.div>
    </div>
  );
}
