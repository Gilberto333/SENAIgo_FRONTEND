import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GerenciarVisitasUsuarios from '../pages/GerenciarVisitasUsuarios/GerenciarVisitasUsuarios';
import Tutorial from '../pages/Tutorial/Tutorial';
import Cadastro from '../pages/Cadastro/Cadastro';
import Login from '../pages/Login/Login';
import EsqueciSenha from '../pages/EsqueciSenha/EsqueciSenha'; 
import Home from '../pages/Home/Home';
import Loja from '../pages/Loja/Loja';
import SalasVisitas from '../pages/SalasVisitas/SalasVisitas'; 
import GerenciarLoja from '../pages/GerenciarLoja/GerenciarLoja';
import GerenciarSalas from '../pages/GerenciarSalas/GerenciarSalas';
import ConsultarResgatesAdmin from '../pages/ConsultarResgatesAdmin/ConsultarResgatesAdmin';
import Dashboard from '../pages/Dashboard/Dashboard';
import PrivateRoute from './PrivateRoute';
import Ranking from '../pages/Ranking/Ranking';

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Tutorial />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/login" element={<Login />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} /> 
      <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/loja" element={<PrivateRoute><Loja /></PrivateRoute>} />
      <Route path="/salas-visitas" element={<PrivateRoute><SalasVisitas /></PrivateRoute>} />
      <Route path="/admin/loja" element={<PrivateRoute adminOnly><GerenciarLoja /></PrivateRoute>} />
      <Route path="/admin/salas" element={<PrivateRoute adminOnly><GerenciarSalas /></PrivateRoute>} />
      <Route path="/admin/resgates" element={<PrivateRoute adminOnly><ConsultarResgatesAdmin /></PrivateRoute>} />
      <Route path="/admin/ranking" element={<PrivateRoute adminOnly><Ranking /></PrivateRoute>} />
      <Route path="/admin/visitas-usuarios" element={<PrivateRoute adminOnly><GerenciarVisitasUsuarios /></PrivateRoute>} />
      <Route path="/admin/dashboard" element={<PrivateRoute adminOnly><Dashboard /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
