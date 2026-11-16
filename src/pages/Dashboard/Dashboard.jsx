import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Menu, Gamepad2, ArrowLeft, User, AlertCircle } from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useAuth } from "../../hooks/useAuth"
import api from "../../services/api"
import "./Dashboard.css"

const MAX_PARTICIPANTES = 50000

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
    const { resumo, salas, salasNaoVisitadas } = dados

    return (
        <>
            <section className="dash-banner">
                <span className="dash-tag">Painel administrativo</span>
                <h1>Visão geral das visitas</h1>
                <p>Acompanhe o desempenho das salas, pontuações e participação via leitura de QR Codes.</p>
            </section>

            <Metricas resumo={resumo} salas={salas} salasNaoVisitadas={salasNaoVisitadas} />

            <ProjecaoEvento />
        </>
    )
}

function Metricas({ resumo, salas, salasNaoVisitadas, estimativa = false }) {
    const aprox = estimativa ? "≈ " : ""

    const kpis = [
        { rotulo: estimativa ? "Visitas previstas" : "Visitas registradas", valor: `${aprox}${resumo.totalVisitas}` },
        { rotulo: "Média de pontos", valor: `${aprox}${resumo.mediaPontos.toLocaleString("pt-BR")}` },
        { rotulo: "Usuários ativos", valor: `${aprox}${resumo.usuariosAtivos} / ${resumo.totalUsuarios}` },
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

    const formatoUmaCasa = { minimumFractionDigits: 1, maximumFractionDigits: 1 }
    const mediaSalasVisitadas = resumo.mediaSalasVisitadas.toLocaleString("pt-BR", formatoUmaCasa)
    const taxaAproveitamento = resumo.taxaAproveitamentoMedia.toLocaleString("pt-BR", formatoUmaCasa)
    const larguraBarra = Math.min(Math.max(resumo.taxaAproveitamentoMedia, 0), 100)

    return (
        <>
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
                        <p className="dash-vazio sucesso">
                            {estimativa
                                ? "Todas as salas ativas devem receber visitas."
                                : "Parabéns! Todas as salas ativas já foram visitadas."}
                        </p>
                    ) : (
                        <ul className="dash-lista">
                            {salasNaoVisitadas.map((s) => (
                                <li key={s.salaId} className="item-nao-visitado">
                                    <span>{s.sala}</span>
                                    <span className="badge-alerta">
                                        {estimativa && s.semHistorico ? "sem histórico" : "0 visitas"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <div className="dash-duas">
                <section className="dash-painel">
                    <h2>Salas visitadas por usuário</h2>
                    <div className="dash-metrica">
                        <strong>{aprox}{mediaSalasVisitadas}</strong>
                        <span>de {resumo.salasAtivas} salas ativas</span>
                    </div>
                    <small className="dash-metrica-legenda">Média de todos os usuários</small>
                </section>

                <section className="dash-painel">
                    <h2>Taxa de aproveitamento por usuário</h2>
                    <div className="dash-progresso">
                        <div
                            className="dash-progresso-trilha"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={larguraBarra}
                            aria-label="Taxa média de aproveitamento das salas"
                        >
                            <span
                                className="dash-progresso-preenchimento"
                                style={{ width: `${larguraBarra}%` }}
                            />
                        </div>
                        <b className="dash-badge">{aprox}{taxaAproveitamento}%</b>
                    </div>
                    <small className="dash-metrica-legenda">Média de todos os usuários</small>
                </section>
            </div>
        </>
    )
}


const formatoNumero = /^\d+(\.\d+)?$/

function paraFracao(percentual) {
    return String(Number((Number(percentual) / 100).toFixed(4)))
}

function paraPercentual(fracao) {
    return (Math.round(fracao * 1000) / 10).toLocaleString("pt-BR")
}

function percentualValido(valor) {
    return formatoNumero.test(valor) && Number(valor) >= 1 && Number(valor) <= 100
}

function ProjecaoEvento() {
    const [participantes, setParticipantes] = useState("")
    const [taxaCadastro, setTaxaCadastro] = useState("70")
    const [taxaParticipacao, setTaxaParticipacao] = useState("")
    const [salasPorParticipante, setSalasPorParticipante] = useState("")
    const [maxSalas, setMaxSalas] = useState(null)
    const [resultado, setResultado] = useState(null)
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState("")

    const pedePremissas = resultado?.modo === "premissas"
    const premissasNecessarias = resultado?.premissasNecessarias === true
    const projecao = resultado && !premissasNecessarias ? resultado : null

    const participantesValidos =
        /^\d+$/.test(participantes) && Number(participantes) >= 1 && Number(participantes) <= MAX_PARTICIPANTES
    const salasValidas =
        formatoNumero.test(salasPorParticipante)
        && Number(salasPorParticipante) >= 1
        && (maxSalas === null || Number(salasPorParticipante) <= maxSalas)

    const formularioValido =
        participantesValidos
        && percentualValido(taxaCadastro)
        && (!pedePremissas || (percentualValido(taxaParticipacao) && salasValidas))

    async function gerar(e) {
        e.preventDefault()
        if (!formularioValido || carregando) return

        setCarregando(true)
        setErro("")

        const params = { participantes, taxaCadastro: paraFracao(taxaCadastro) }
        if (pedePremissas) {
            params.taxaParticipacao = paraFracao(taxaParticipacao)
            params.salasPorParticipante = salasPorParticipante
        }

        try {
            const { data } = await api.get("/api/dashboard/projecao", { params })

            if (data.premissasNecessarias) {
                setTaxaParticipacao(String(Math.round(data.sugestoes.taxaParticipacao * 100)))
                setSalasPorParticipante(String(data.sugestoes.salasPorParticipante))
                setMaxSalas(data.limites.salasPorParticipante.max)
            } else {
                setMaxSalas(data.resumo.salasAtivas)
            }

            setResultado(data)
        } catch (err) {
            setErro(err.message || "Não foi possível gerar a projeção.")
        } finally {
            setCarregando(false)
        }
    }

    const salasSemHistorico = projecao?.modo === "historico"
        ? projecao.salas.filter((s) => s.semHistorico)
        : []

    return (
        <section className="dash-painel dash-projecao">
            <h2>Projeção do Evento</h2>
            <p className="proj-intro">
                Estime como o evento pode se comportar antes dele acontecer. É uma aproximação, não uma previsão exata.
            </p>

            <form onSubmit={gerar}>
                <div className="proj-form">
                    <label className="proj-campo">
                        Quantidade esperada de pessoas
                        <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max={MAX_PARTICIPANTES}
                            step="1"
                            placeholder="Ex.: 200"
                            value={participantes}
                            onChange={(e) => setParticipantes(e.target.value)}
                        />
                    </label>

                    <label className="proj-campo">
                        Taxa de cadastro (%)
                        <input
                            type="number"
                            inputMode="decimal"
                            min="1"
                            max="100"
                            step="any"
                            value={taxaCadastro}
                            onChange={(e) => setTaxaCadastro(e.target.value)}
                        />
                        <small className="proj-ajuda">De cada 100 pessoas, quantas se cadastram no app.</small>
                    </label>

                    {pedePremissas && (
                        <>
                            <label className="proj-campo">
                                Taxa de participação (%)
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min="1"
                                    max="100"
                                    step="any"
                                    value={taxaParticipacao}
                                    onChange={(e) => setTaxaParticipacao(e.target.value)}
                                />
                                <small className="proj-ajuda">Dos cadastrados, quantos realmente visitam salas.</small>
                            </label>

                            <label className="proj-campo">
                                Salas por participante
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min="1"
                                    max={maxSalas ?? undefined}
                                    step="any"
                                    value={salasPorParticipante}
                                    onChange={(e) => setSalasPorParticipante(e.target.value)}
                                />
                                <small className="proj-ajuda">
                                    Quantas salas, em média, cada participante visita
                                    {maxSalas !== null ? ` (de 1 a ${maxSalas})` : ""}.
                                </small>
                            </label>
                        </>
                    )}
                </div>

                {premissasNecessarias && (
                    <p className="proj-aviso" role="status">
                        {resultado.base.aviso} Confira as premissas sugeridas acima, ajuste se quiser e clique em Gerar Projeção novamente.
                    </p>
                )}

                <div className="proj-acoes">
                    <button type="submit" className="proj-botao" disabled={!formularioValido || carregando}>
                        {carregando ? "Gerando…" : "Gerar Projeção"}
                    </button>
                    {erro && <p className="proj-erro" role="alert">{erro}</p>}
                </div>
            </form>

            {projecao && (
                <div className="proj-resultado" aria-live="polite">
                    <div className="proj-topo">
                        <h3>Projeção para {projecao.participantesEsperados.toLocaleString("pt-BR")} pessoas</h3>
                        <span className="proj-selo">Estimativa</span>
                    </div>

                    <p className="proj-origem">
                        {projecao.modo === "historico"
                            ? `Baseada em ${projecao.base.usuariosAtivosHistoricos} usuários ativos e ${projecao.base.visitasHistoricas} visitas do histórico. Assume ${paraPercentual(projecao.premissas.taxaCadastro)}% de cadastro entre as pessoas esperadas.`
                            : `Baseada nas premissas informadas por você: ${paraPercentual(projecao.premissas.taxaCadastro)}% de cadastro, ${paraPercentual(projecao.premissas.taxaParticipacao)}% de participação e ${projecao.premissas.salasPorParticipante.toLocaleString("pt-BR")} sala(s) por participante. As visitas foram divididas igualmente entre as salas.`}
                    </p>

                    {projecao.base.aviso && <p className="proj-aviso">{projecao.base.aviso}</p>}

                    {salasSemHistorico.length > 0 && (
                        <p className="proj-aviso">
                            Sem histórico para estimar: {salasSemHistorico.map((s) => s.sala).join(", ")}.
                        </p>
                    )}

                    <Metricas
                        resumo={projecao.resumo}
                        salas={projecao.salas}
                        salasNaoVisitadas={projecao.salasNaoVisitadas}
                        estimativa
                    />
                </div>
            )}
        </section>
    )
}