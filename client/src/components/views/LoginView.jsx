import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import logoImg from '../../assets/img/logo.png';
import fondoPOS from '../../assets/img/fondoPOS.png';

export const LoginView = () => {
  const { login } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Por favor ingresa tu usuario/correo y contraseña');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    const res = await login(identifier.trim(), password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Credenciales inválidas');
    }
  };

  return (
    <div 
      className="h-screen w-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 select-none relative overflow-hidden"
      style={{ backgroundImage: `url(${fondoPOS})` }}
    >
      {/* Overlay to improve contrast and readability */}
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/40 overflow-hidden relative z-10">
        {/* Header Branding */}
        <div className="p-6 text-center border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
          <img src={logoImg} alt="NexPOS Logo" className="w-16 h-16 mx-auto mb-3 object-contain drop-shadow-md" />
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Nex<span className="text-blue-600">POS</span> Suite
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            RETAIL SUITE &amp; ERP • SISTEMA DE GESTIÓN
          </p>
        </div>

        {/* Login Form */}
        <form className="p-6 space-y-4 text-xs" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <span className="material-symbols-outlined text-base text-rose-600">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1 text-[11px]">
              Correo Electrónico o Nombre de Usuario
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                person
              </span>
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                placeholder="ej. admin o elena.morales@nexpos.local"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 text-[11px]">Contraseña</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                <span className="material-symbols-outlined text-base">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span>Iniciando sesión...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">login</span>
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
