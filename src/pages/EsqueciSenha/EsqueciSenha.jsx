import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { esqueciSenha, redefinirSenha } from '../../services/senhaService';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';
import Logo from '../../components/Logo/Logo';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import styles from './EsqueciSenha.module.css';

const EsqueciSenha = () => {
  const [etapa, setEtapa] = useState('email'); 
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validarEmail = (val) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val);
  };

  const handleEnviarCodigo = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Informe seu e-mail para continuar.');
      return;
    }

    if (!validarEmail(trimmedEmail)) {
      setError('Insira um e-mail com formato válido (ex: aluno@senai.br).');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await esqueciSenha(trimmedEmail);
      setEtapa('codigo');
      setInfo('Enviamos um código de 6 dígitos para seu e-mail. Ele é válido por 15 minutos.');
      setTimer(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReenviarCodigo = async () => {
    if (timer > 0 || loading) return;

    setError('');
    setInfo('');
    setLoading(true);

    try {
      await esqueciSenha(email.trim());
      setInfo('Novo código enviado com sucesso!');
      setTimer(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedefinirSenha = async (e) => {
    e.preventDefault();

    if (!codigo.trim() || codigo.trim().length !== 6) {
      setError('O código de verificação deve conter 6 dígitos.');
      return;
    }

    if (!novaSenha) {
      setError('Digite a nova senha.');
      return;
    }

    if (novaSenha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await redefinirSenha(email.trim(), codigo.trim(), novaSenha);
      navigate('/login', { replace: true, state: { senhaAlterada: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoltarEtapa = () => {
    setEtapa('email');
    setError('');
    setInfo('');
    setCodigo('');
    setNovaSenha('');
    setConfirmarSenha('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.cardWrapper}>
        <div className={styles.logoHeader}>
          <Logo size="large" />
          <span className={styles.gamerSubtitle}>Plataforma de Gamificação</span>
        </div>

        <Card className={styles.card}>
          <div className={styles.headerText}>
            <h2>{etapa === 'email' ? 'Recuperar Senha' : 'Redefinir Senha'}</h2>
            <p>
              {etapa === 'email'
                ? 'Digite seu e-mail para receber o código de verificação'
                : `Código enviado para ${email}`}
            </p>
          </div>

          {info && <Alert variant="success">{info}</Alert>}
          {error && <Alert variant="error">{error}</Alert>}

          {etapa === 'email' ? (
            <form onSubmit={handleEnviarCodigo} className={styles.form}>
              <Input
                id="esqueci-email"
                type="email"
                label="E-mail"
                placeholder="seu.email@aluno.senai.br"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                icon={Mail}
                required
              />

              

              <Button type="submit" variant="primary" fullWidth icon={Mail} loading={loading}>
                {loading ? 'Enviando...' : 'Enviar código'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRedefinirSenha} className={styles.form}>
              <Input
                id="esqueci-codigo"
                type="text"
                label="Código de verificação"
                placeholder="123456"
                value={codigo}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCodigo(val);
                  setError('');
                }}
                icon={KeyRound}
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />

              <Input
                id="esqueci-nova-senha"
                type="password"
                label="Nova Senha"
                placeholder="Mínimo de 6 caracteres"
                value={novaSenha}
                onChange={(e) => {
                  setNovaSenha(e.target.value);
                  setError('');
                }}
                icon={Lock}
                required
              />

              <Input
                id="esqueci-confirmar-senha"
                type="password"
                label="Confirmar Nova Senha"
                placeholder="Repita a nova senha"
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value);
                  setError('');
                }}
                icon={Lock}
                required
              />

              <Button type="submit" variant="primary" fullWidth icon={CheckCircle2} loading={loading}>
                {loading ? 'Alterando...' : 'Alterar senha'}
              </Button>

              <div className={styles.actionsGroup}>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  disabled={timer > 0 || loading}
                  onClick={handleReenviarCodigo}
                >
                  {timer > 0 ? `Reenviar código (${timer}s)` : 'Reenviar código'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  icon={ArrowLeft}
                  onClick={handleVoltarEtapa}
                  disabled={loading}
                >
                  Alterar e-mail
                </Button>
              </div>
            </form>
          )}

          <div className={styles.footerText}>
            <span>Lembrou a senha? </span>
            <Link to="/login" className={styles.link}>
              Voltar ao Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EsqueciSenha;