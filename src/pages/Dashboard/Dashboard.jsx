import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Menu, Gamepad2, ArrowLeft, User, AlertCircle, Clock } from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useAuth } from "../../hooks/useAuth"
import api from "../../services/api"
import "./Dashboard.css"

function formatarTempoRelativo(segundosAtras) {
    if (segundosAtras < 60) return "Agora mesmo"
    const minutos = Math.floor(segundosAtras / 60)
    if (minutos < 60) return `Há ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
    const horas = Math.floor(minutos / 60)
    if (horas < 24) return `Há ${horas} ${horas === 1 ? 'hora' : 'horas'}`
    const dias = Math.floor(horas / 24)
    return `Há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

export default function Dashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [menuAberto, setMenuAberto] = useState(false)
    const [dados, setDados] = useState(null)
    const [erro, setErro] = useState("")

    const nome = user?.nome || "Admin"

    useEffect(() => {
        api.get("/api/dashboard")
            .then((res) => setDados(res.data))
            .catch((err) => {
                setErro(err.message || "Não foi possível carregar os dados. Verifique se o servidor está rodando.")
            })
    }, [])

    return (
        <div className="dash-page">
            <Sidebar isOpen={menuAberto} onClose={() => setMenuAberto(false)} />

            <header className="dash-header">
                <div className="dash-header-esq">
                    <button
                        type="button"
                        className="dash-menu-btn"
                        onClick={() => setMenuAberto(true)}
                        aria-label="Abrir menu"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="dash-logo">
                        <span className="dash-logo-icone"><Gamepad2 size={20} /></span>
                        <span className="dash-logo-texto">SENAI<i>go</i></span>
                    </div>
                </div>

                <div className="dash-ola">
                    <User size={16} />
                    <span>Olá, <b>{nome}</b></span>
                </div>

                <button type="button" className="dash-voltar" onClick={() => navigate("/home")}>
                    <ArrowLeft size={18} />
                    <span>Voltar</span>
                </button>
            </header>

            <main className="dash">
                {erro && <p className="dash-msg dash-erro">{erro}</p>}
                {!erro && !dados && <p className="dash-msg">Carregando dashboard…</p>}
                {dados && <Conteudo dados={dados} />}
            </main>
        </div>
    )
}

function Conteudo({ dados }) {
    const { resumo, salas, salasNaoVisitadas, topUsuarios, ultimasVisitas } = dados

    const kpis = [
        { rotulo: "Visitas registradas", valor: resumo.totalVisitas },
        { rotulo: "Média de pontos", valor: resumo.mediaPontos.toLocaleString("pt-BR") },
        { rotulo: "Usuários ativos", valor: `${resumo.usuariosAtivos} / ${resumo.totalUsuarios}` },
        { rotulo: "Salas ativas", valor: resumo.salasAtivas }
    ]

    const totalVisitasSalas = salas.reduce((acc, s) => acc + s.visitas, 0)
    let acumulado = 0
    const coresPian = ["#233a6b", "#c94a1f", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"]
    
    const fatiasPizza = salas.map((s, index) => {
        if (totalVisitasSalas === 0 || s.visitas === 0) return null
        const porcentagem = (s.visitas / totalVisitasSalas) * 100
        const inicio = acumulado
        acumulado += porcentagem
        return `${coresPian[index % coresPian.length]} ${inicio}% ${acumulado}%`
    }).filter(Boolean)

    const estiloGraficoPizza = {
        background: fatiasPizza.length > 0 
            ? `conic-gradient(${fatiasPizza.join(", ")})` 
            : "#e3e8f0"
    }

    return (
        <>
            <section className="dash-banner">
                <span className="dash-tag">Painel administrativo</span>
                <h1>Visão geral das visitas</h1>
                <p>Acompanhe o desempenho das salas, pontuações e participação via leitura de QR Codes.</p>
            </section>

            <section className="dash-kpis">
                {kpis.map((k) => (
                    <div key={k.rotulo} className="dash-kpi">
                        <strong>{k.valor}</strong>
                        <span>{k.rotulo}</span>
                    </div>
                ))}
            </section>

            <div className="dash-duas">
                <section className="dash-painel">
                    <h2>Distribuição de Visitas</h2>
                    {totalVisitasSalas === 0 ? (
                        <p className="dash-vazio">Nenhuma visita registrada para exibir no gráfico.</p>
                    ) : (
                        <div className="container-grafico-pizza">
                            <div className="grafico-pizza" style={estiloGraficoPizza} />
                            <ul className="legenda-pizza">
                                {salas.map((s, index) => (
                                    s.visitas > 0 && (
                                        <li key={s.salaId}>
                                            <span 
                                                className="cor-legenda" 
                                                style={{ backgroundColor: coresPian[index % coresPian.length] }} 
                                            />
                                            <span>{s.sala}: <b>{s.visitas}</b></span>
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                <section className="dash-painel dash-nao-visitadas">
                    <h2><AlertCircle size={18} /> Salas Não Visitadas</h2>
                    {(!salasNaoVisitadas || salasNaoVisitadas.length === 0) ? (
                        <p className="dash-vazio sucesso">Parabéns! Todas as salas ativas já foram visitadas.</p>
                    ) : (
                        <ul className="dash-lista">
                            {salasNaoVisitadas.map((s) => (
                                <li key={s.salaId} className="item-nao-visitado">
                                    <span>{s.sala}</span>
                                    <span className="badge-alerta">0 visitas</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <div className="dash-duas">
                <section className="dash-painel">
                    <h2>Maiores pontuações</h2>
                    {topUsuarios.length === 0 ? (
                        <p className="dash-vazio">Ainda não há usuários.</p>
                    ) : (
                        <ol className="dash-lista">
                            {topUsuarios.map((u, i) => (
                                <li key={u.nome + i}>
                                    <span>{i + 1}. {u.nome}</span>
                                    <b className="dash-badge">{u.pontos} pts</b>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <section className="dash-painel">
                    <h2>Últimas visitas</h2>
                    {ultimasVisitas.length === 0 ? (
                        <p className="dash-vazio">Nenhuma visita registrada.</p>
                    ) : (
                        <ul className="dash-lista">
                            {ultimasVisitas.map((v, i) => (
                                <li key={i} className="visita-item-recente">
                                    <div className="visita-info-principal">
                                        <span><b>{v.nome}</b> em <em>{v.sala}</em></span>
                                        <small className="tempo-leitura">
                                            <Clock size={12} /> {formatarTempoRelativo(v.segundosAtras)}
                                        </small>
                                    </div>
                                    <b className="dash-badge">+{v.pontuacao}</b>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    )
}