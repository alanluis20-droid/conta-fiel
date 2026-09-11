import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import './index.css'
import PanoramaAnual from './PanoramaAnual'

const CATEGORIAS = [
  'Moradia',
  'Alimentação',
  'Vestimentas',
  'Saúde',
  'Reparos e Manutenções',
  'Autocuidado',
  'Seguros',
  'Assinaturas',
  'Lazer',
  'Viagens',
  'Presentes e Contribuições',
  'Dívidas',
  'Reserva',
  'Estudos',
]

const CATEGORIAS_ENTRADA = [
  'Folha Normal',
  'Adicional',
]

const CORES = {
  'Dívidas': '#e8a6a6',
  'Moradia': '#a9c4df',
  'Alimentação': '#a9cdb5',
  'Vestimentas': '#d5b5d9',
  'Saúde': '#b8c9e2',
  'Reparos e Manutenções': '#d7bd91',
  'Autocuidado': '#e2b6c7',
  'Seguros': '#b7c7b0',
  'Assinaturas': '#c6b8dc',
  'Lazer': '#e4c18e',
  'Viagens': '#a9c7c9',
  'Presentes e Contribuições': '#d2b8a2',
  'Reserva': '#9fc8b4',
  'Estudos': '#aebbd3',
}

function App() {
  const hoje = new Date()
  const mesAtual = hoje.toISOString().slice(0, 7)
  const dataAtual = hoje.toISOString().slice(0, 10)

  const [session, setSession] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modoCadastro, setModoCadastro] = useState(false)
  const [mensagemLogin, setMensagemLogin] = useState('')

  const [mes, setMes] = useState(mesAtual)
  const [lancamentos, setLancamentos] = useState([])
  const [carregandoDados, setCarregandoDados] = useState(false)

  const [tipo, setTipo] = useState('saida')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [valor, setValor] = useState('')
  const [data, setData] = useState(dataAtual)
  const [fixo, setFixo] = useState(false)

  const [editando, setEditando] = useState(null)
  const [mensagem, setMensagem] = useState('')

  // =========================
  // AUTENTICAÇÃO
  // =========================

  useEffect(() => {
    async function iniciar() {
      const { data } = await supabase.auth.getSession()

      setSession(data.session)
      setCarregando(false)
    }

    iniciar()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, novaSession) => {
        setSession(novaSession)
        setCarregando(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function entrar(event) {
    event.preventDefault()
    setMensagemLogin('Entrando...')

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })

    if (error) {
      setMensagemLogin('Erro: ' + error.message)
      return
    }

    setMensagemLogin('')
  }

  async function cadastrar(event) {
    event.preventDefault()
    setMensagemLogin('Criando conta...')

    const { error } =
      await supabase.auth.signUp({
        email,
        password: senha,
      })

    if (error) {
      setMensagemLogin('Erro: ' + error.message)
      return
    }

    setMensagemLogin(
      'Conta criada. Verifique seu e-mail para confirmar.'
    )
  }

  async function sair() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setMensagem('Erro ao sair: ' + error.message)
      return
    }

    setLancamentos([])
  }

  // =========================
  // CARREGAR BANCO
  // =========================

  useEffect(() => {
    if (session) {
      carregarLancamentos()
    }
  }, [session])

  async function carregarLancamentos() {
    if (!session) return

    setCarregandoDados(true)
    setMensagem('')

    const { data, error } =
      await supabase
        .from('lancamentos')
        .select('*')
        .order('data', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) {
      setMensagem(
        'Erro ao carregar dados: ' + error.message
      )
      setCarregandoDados(false)
      return
    }

    setLancamentos(data || [])
    setCarregandoDados(false)
  }

  // =========================
  // DATAS
  // =========================

  function dataParaMes(dataBase, quantidadeMeses) {
    const [ano, mes, dia] =
      dataBase.split('-').map(Number)

    const novaData = new Date(
      ano,
      mes - 1 + quantidadeMeses,
      1
    )

    const ultimoDia =
      new Date(
        novaData.getFullYear(),
        novaData.getMonth() + 1,
        0
      ).getDate()

    const diaFinal = Math.min(dia, ultimoDia)

    return (
      `${novaData.getFullYear()}-` +
      `${String(novaData.getMonth() + 1).padStart(2, '0')}-` +
      `${String(diaFinal).padStart(2, '0')}`
    )
  }

  // =========================
  // FORMATAÇÃO
  // =========================

  function formatarMoeda(numero) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(numero) || 0)
  }

  function formatarData(dataTexto) {
    if (!dataTexto) return ''

    const [ano, mes, dia] =
      dataTexto.split('-')

    return `${dia}/${mes}/${ano}`
  }

  function formatarMes(mesTexto) {
    const [ano, mesNumero] =
      mesTexto.split('-')

    const nomes = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ]

    return `${nomes[Number(mesNumero) - 1]} ${ano}`
  }

  // =========================
  // NAVEGAÇÃO
  // =========================

  function mesAnterior() {
    const d = new Date(`${mes}-01T12:00:00`)
    d.setMonth(d.getMonth() - 1)

    setMes(d.toISOString().slice(0, 7))
  }

  function mesSeguinte() {
    const d = new Date(`${mes}-01T12:00:00`)
    d.setMonth(d.getMonth() + 1)

    setMes(d.toISOString().slice(0, 7))
  }

  // =========================
  // FORMULÁRIO
  // =========================

  function mudarTipo(novoTipo) {
    setTipo(novoTipo)

    setCategoria(
      novoTipo === 'entrada'
        ? CATEGORIAS_ENTRADA[0]
        : CATEGORIAS[0]
    )

    // NÃO desmarca o Fixo ao mudar para Entrada.
  }

  function limparFormulario() {
    setDescricao('')
    setValor('')
    setData(dataAtual)
    setFixo(false)
    setEditando(null)
    setTipo('saida')
    setCategoria(CATEGORIAS[0])
  }

  function iniciarEdicao(item) {
    setEditando(item.id)
    setTipo(item.tipo)
    setDescricao(item.descricao)
    setCategoria(item.categoria)

    setValor(
      Number(item.valor)
        .toFixed(2)
        .replace('.', ',')
    )

    setData(item.data)
    setFixo(item.fixo === true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // =========================
  // LANÇAMENTOS FIXOS
  // =========================

  async function criarMesesFixos(registro, serieId) {
    for (let i = 1; i <= 12; i++) {
      const novaData =
        dataParaMes(registro.data, i)

      const {
        data: existente,
        error: erroBusca,
      } = await supabase
        .from('lancamentos')
        .select('id')
        .eq('serie_fixa_id', serieId)
        .eq('data', novaData)
        .maybeSingle()

      if (erroBusca) {
        throw erroBusca
      }

      if (!existente) {
        const { error } =
          await supabase
            .from('lancamentos')
            .insert({
              user_id: session.user.id,
              tipo: registro.tipo,
              descricao: registro.descricao,
              categoria: registro.categoria,
              valor: registro.valor,
              data: novaData,
              fixo: true,
              serie_fixa_id: serieId,
            })

        if (error) {
          throw error
        }
      }
    }
  }

  // =========================
  // SALVAR
  // =========================

  async function salvarLancamento(event) {
    event.preventDefault()
    setMensagem('')

    const valorNumerico =
      Number(
        valor
          .replace(/\./g, '')
          .replace(',', '.')
      )

    if (!descricao.trim()) {
      setMensagem('Informe uma descrição.')
      return
    }

    if (!valorNumerico || valorNumerico <= 0) {
      setMensagem('Informe um valor válido.')
      return
    }

    if (!data) {
      setMensagem('Informe a data.')
      return
    }

    const confirmarSalvamento = window.confirm(
      editando
        ? 'Salvar as alterações deste lançamento?'
        : 'Salvar este lançamento?'
    )

    if (!confirmarSalvamento) return

    const registro = {
      user_id: session.user.id,
      tipo,
      descricao: descricao.trim(),
      categoria,
      valor:
        Math.round(valorNumerico * 100) / 100,
      data,
      fixo,
      serie_fixa_id: null,
    }

    try {
      // =========================
      // EDITAR
      // =========================

      if (editando) {
        const antigo =
          lancamentos.find(
            (item) => item.id === editando
          )

        let serieId =
          antigo?.serie_fixa_id || null

        // Fixa -> não fixa
        if (
          antigo?.fixo === true &&
          registro.fixo === false
        ) {
          if (serieId) {
            const apagarFuturos =
              window.confirm(
                'Este lançamento faz parte de uma série fixa mensal.\n\n' +
                'OK = apagar os meses seguintes.\n' +
                'Cancelar = retirar o Fixo apenas deste mês.'
              )

            if (apagarFuturos) {
              const { error } =
                await supabase
                  .from('lancamentos')
                  .delete()
                  .eq(
                    'serie_fixa_id',
                    serieId
                  )
                  .gt(
                    'data',
                    antigo.data
                  )

              if (error) {
                throw error
              }
            }
          }

          registro.fixo = false
          registro.serie_fixa_id = null
        }

        // Não fixa -> fixa
        else if (
          antigo?.fixo === false &&
          registro.fixo === true
        ) {
          serieId = crypto.randomUUID()
          registro.serie_fixa_id = serieId
        }

        // Continua fixa
        else if (
          antigo?.fixo === true &&
          registro.fixo === true
        ) {
          serieId =
            serieId || crypto.randomUUID()

          registro.serie_fixa_id = serieId
        }

        else {
          registro.serie_fixa_id = null
        }

        // ==================================================
        // NOVA LÓGICA:
        // Se continua sendo fixa, pergunta se a alteração
        // deve ser aplicada aos meses seguintes.
        // ==================================================

        let aplicarNosSeguintes = false

        if (
          antigo?.fixo === true &&
          registro.fixo === true &&
          registro.serie_fixa_id
        ) {
          aplicarNosSeguintes =
            window.confirm(
              `Este lançamento é uma ${
                registro.tipo === 'entrada'
                  ? 'Receita Fixa'
                  : 'Despesa Fixa'
              }.\n\n` +
              'Deseja aplicar a alteração aos meses seguintes?\n\n' +
              'OK = Sim\n' +
              'Cancelar = Não'
            )
        }

        // Atualiza o mês que está sendo editado
        const { error } =
          await supabase
            .from('lancamentos')
            .update(registro)
            .eq('id', editando)

        if (error) {
          throw error
        }

        // Se o usuário escolheu SIM,
        // atualiza somente os registros futuros
        // da mesma série.
        if (
          aplicarNosSeguintes &&
          registro.serie_fixa_id
        ) {
          const { error: erroFuturos } =
            await supabase
              .from('lancamentos')
              .update({
                tipo: registro.tipo,
                descricao: registro.descricao,
                categoria: registro.categoria,
                valor: registro.valor,
                fixo: true,
              })
              .eq(
                'serie_fixa_id',
                registro.serie_fixa_id
              )
              .gt(
                'data',
                registro.data
              )

          if (erroFuturos) {
            throw erroFuturos
          }
        }

        // Continua garantindo que existam os próximos
        // meses da série, sem criar duplicados.
        if (
          registro.fixo &&
          registro.serie_fixa_id
        ) {
          await criarMesesFixos(
            registro,
            registro.serie_fixa_id
          )
        }

        setMensagem(
          '✓ Lançamento atualizado com sucesso.'
        )
      }

      // =========================
      // NOVO
      // =========================

      else {
        let serieId = null

        if (registro.fixo) {
          serieId = crypto.randomUUID()
          registro.serie_fixa_id = serieId
        }

        const {
          data: novo,
          error,
        } = await supabase
          .from('lancamentos')
          .insert(registro)
          .select()
          .single()

        if (error) {
          throw error
        }

        if (
          novo.fixo &&
          novo.serie_fixa_id
        ) {
          await criarMesesFixos(
            novo,
            novo.serie_fixa_id
          )
        }

        setMensagem('✓ Lançamento salvo com sucesso.')
      }

      limparFormulario()
      await carregarLancamentos()

    } catch (error) {
      console.error(error)

      setMensagem(
        'Erro: ' + error.message
      )
    }
  }

  // =========================
  // EXCLUIR
  // =========================

  async function excluirLancamento(id) {
    const item =
      lancamentos.find(
        (x) => x.id === id
      )

    if (!item) return

    let apagarSerie = false

    if (
      item.fixo &&
      item.serie_fixa_id
    ) {
      apagarSerie =
        window.confirm(
          'Este lançamento faz parte de uma série fixa mensal.\n\n' +
          'OK = apagar este e os meses seguintes.\n' +
          'Cancelar = apagar somente este mês.'
        )
    } else {
      const confirmar =
        window.confirm(
          `Excluir o lançamento "${item.descricao}" de ${formatarMoeda(item.valor)}?\n\n` +
          'Essa ação não poderá ser desfeita.'
        )

      if (!confirmar) return
    }

    try {
      if (apagarSerie) {
        const { error } =
          await supabase
            .from('lancamentos')
            .delete()
            .eq(
              'serie_fixa_id',
              item.serie_fixa_id
            )
            .gte(
              'data',
              item.data
            )

        if (error) {
          throw error
        }
      } else {
        const { error } =
          await supabase
            .from('lancamentos')
            .delete()
            .eq('id', id)

        if (error) {
          throw error
        }
      }

      if (editando === id) {
        limparFormulario()
      }

      await carregarLancamentos()
      setMensagem('✓ Lançamento excluído com sucesso.')

    } catch (error) {
      setMensagem(
        'Erro ao excluir: ' +
        error.message
      )
    }
  }

  // =========================
  // CÁLCULOS DO MÊS
  // =========================

  const dadosMes = useMemo(() => {
    return lancamentos.filter(
      (item) =>
        item.data.slice(0, 7) === mes
    )
  }, [lancamentos, mes])

  const dadosAteMes = useMemo(() => {
    return lancamentos.filter(
      (item) =>
        item.data.slice(0, 7) <= mes
    )
  }, [lancamentos, mes])

  const entradasMes =
    dadosMes
      .filter(
        (item) =>
          item.tipo === 'entrada'
      )
      .reduce(
        (total, item) =>
          total + Number(item.valor),
        0
      )

  const saidasMes =
    dadosMes
      .filter(
        (item) =>
          item.tipo === 'saida'
      )
      .reduce(
        (total, item) =>
          total + Number(item.valor),
        0
      )

  const saldoMes =
    entradasMes - saidasMes

  const saldoAcumulado =
    dadosAteMes.reduce(
      (total, item) =>
        total +
        (
          item.tipo === 'entrada'
            ? Number(item.valor)
            : -Number(item.valor)
        ),
      0
    )

  // =========================
  // CATEGORIAS
  // =========================

  const categorias =
    useMemo(() => {
      const mapa = {}

      dadosMes
        .filter(
          (item) =>
            item.tipo === 'saida'
        )
        .forEach((item) => {
          mapa[item.categoria] =
            (mapa[item.categoria] || 0) +
            Number(item.valor)
        })

      return Object.entries(mapa)
        .sort(
          (a, b) => b[1] - a[1]
        )
        .map(
          ([nome, total]) => ({
            nome,
            total,
            percentual:
              saidasMes
                ? (total / saidasMes) * 100
                : 0,
          })
        )
    }, [dadosMes, saidasMes])

  // =========================
  // ORDENAÇÃO
  // =========================

  function ordenarLancamentos(lista) {
    return [...lista].sort((a, b) => {
      const dataCompare =
        a.data.localeCompare(b.data)

      if (dataCompare !== 0) {
        return dataCompare
      }

      if (a.tipo !== b.tipo) {
        return a.tipo === 'entrada'
          ? -1
          : 1
      }

      return (
        new Date(a.created_at) -
        new Date(b.created_at)
      )
    })
  }

  const entradas =
    ordenarLancamentos(
      dadosMes.filter(
        (item) =>
          item.tipo === 'entrada'
      )
    )

  const fixas =
    ordenarLancamentos(
      dadosMes.filter(
        (item) =>
          item.tipo === 'saida' &&
          item.fixo === true
      )
    )

  const variaveis =
    ordenarLancamentos(
      dadosMes.filter(
        (item) =>
          item.tipo === 'saida' &&
          item.fixo !== true
      )
    )

  // =========================
  // CARREGANDO
  // =========================

  if (carregando) {
    return (
      <div className="loading">
        Carregando...
      </div>
    )
  }

  // =========================
  // LOGIN
  // =========================

  if (!session) {
    return (
      <div className="loading">

        <div
          className="card"
          style={{
            width: 360,
            maxWidth: '90%',
          }}
        >

          <h1>
            Conta Fiel
          </h1>

          <p>
            {modoCadastro
              ? 'Criar conta'
              : 'Entrar'}
          </p>

          <form
            onSubmit={
              modoCadastro
                ? cadastrar
                : entrar
            }
          >

            <label>
              E-mail

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
              />
            </label>

            <label>
              Senha

              <input
                type="password"
                value={senha}
                onChange={(e) =>
                  setSenha(
                    e.target.value
                  )
                }
                required
                minLength={6}
              />
            </label>

            <button
              className="primary"
              type="submit"
            >
              {modoCadastro
                ? 'Criar conta'
                : 'Entrar'}
            </button>

          </form>

          {mensagemLogin && (
            <div className="message">
              {mensagemLogin}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setModoCadastro(
                !modoCadastro
              )
              setMensagemLogin('')
            }}
            style={{
              width: '100%',
              marginTop: 15,
              border: 0,
              background:
                'transparent',
              textDecoration:
                'underline',
              cursor: 'pointer',
            }}
          >
            {modoCadastro
              ? 'Já tenho uma conta — Entrar'
              : 'Ainda não tenho conta — Criar conta'}
          </button>

        </div>

      </div>
    )
  }

  // =========================
  // APLICATIVO
  // =========================

  return (
    <div className="app">

      <header>

        <div className="container header-content">

          <div>

            <h1>
              Conta Fiel
            </h1>

            <div className="subtitle">
              Seu dinheiro sob controle
            </div>

          </div>

          <button
            className="logout"
            onClick={sair}
          >
            Sair
          </button>

        </div>

      </header>

      <main className="container main">

        {/* MÊS */}

        <div className="month-selector">

          <button
            onClick={mesAnterior}
          >
            ‹
          </button>

          <input
            type="month"
            value={mes}
            onChange={(e) =>
              setMes(e.target.value)
            }
          />

          <button
            onClick={mesSeguinte}
          >
            ›
          </button>

        </div>

        <div className="month-title">
          {formatarMes(mes)}
        </div>

        {/* RESUMO */}

        <div className="summary-grid">

          <div className="card">

            <div className="label">
              Entradas
            </div>

            <div className="big green">
              {formatarMoeda(
                entradasMes
              )}
            </div>

          </div>

          <div className="card">

            <div className="label">
              Gastos
            </div>

            <div className="big red">
              {formatarMoeda(
                saidasMes
              )}
            </div>

          </div>

        </div>

        <div className="summary-grid">

          <div className="card">

            <div className="label">
              Saldo do mês
            </div>

            <div
              className={`big ${
                saldoMes >= 0
                  ? 'green'
                  : 'red'
              }`}
            >
              {formatarMoeda(
                saldoMes
              )}
            </div>

          </div>

          <div className="card">

            <div className="label">
              Saldo acumulado
            </div>

            <div
              className={`big ${
                saldoAcumulado >= 0
                  ? 'green'
                  : 'red'
              }`}
            >
              {formatarMoeda(
                saldoAcumulado
              )}
            </div>

          </div>

        </div>

        {/* ABAS */}

        <div className="tabs">

          <button
            className={
              tipo === 'entrada'
                ? 'tab active income-tab'
                : 'tab'
            }
            onClick={() =>
              mudarTipo('entrada')
            }
          >
            ＋ Entrada
          </button>

          <button
            className={
              tipo === 'saida'
                ? 'tab active expense-tab'
                : 'tab'
            }
            onClick={() =>
              mudarTipo('saida')
            }
          >
            − Saída
          </button>

        </div>

        {/* FORMULÁRIO */}

        <section className="card">

          <h2>
            {editando
              ? 'Editar lançamento'
              : tipo === 'entrada'
                ? 'Lançar entrada'
                : 'Lançar saída'}
          </h2>

          <form
            onSubmit={
              salvarLancamento
            }
          >

            <label>
              Descrição

              <input
                value={descricao}
                onChange={(e) =>
                  setDescricao(
                    e.target.value
                  )
                }
                placeholder={
                  tipo === 'entrada'
                    ? ''
                    : 'Ex.: Mercado'
                }
              />
            </label>

            <div className="form-grid">

              <label>
                Categoria

                <select
                  value={categoria}
                  onChange={(e) =>
                    setCategoria(
                      e.target.value
                    )
                  }
                >
                  {(tipo === 'entrada'
                    ? CATEGORIAS_ENTRADA
                    : CATEGORIAS
                  ).map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>

              </label>

              <label>
                Valor (R$)

                <input
                  value={valor}
                  onChange={(e) =>
                    setValor(
                      e.target.value
                    )
                  }
                  inputMode="decimal"
                  placeholder="0,00"
                />
              </label>

              <label>
                Data

                <input
                  type="date"
                  value={data}
                  onChange={(e) =>
                    setData(
                      e.target.value
                    )
                  }
                />
              </label>

              <label className="checkbox">

                <input
                  type="checkbox"
                  checked={fixo}
                  onChange={(e) =>
                    setFixo(
                      e.target.checked
                    )
                  }
                />

                <span>
                  {tipo === 'entrada'
                    ? 'Receita Fixa'
                    : 'Despesa Fixa'}
                </span>

              </label>

            </div>

            <div className="form-actions">

              <button
                className="primary"
                type="submit"
              >
                {editando
                  ? 'Salvar alteração'
                  : 'Salvar'}
              </button>

              {editando && (

                <button
                  className="secondary"
                  type="button"
                  onClick={
                    limparFormulario
                  }
                >
                  Cancelar edição
                </button>

              )}

            </div>

          </form>

          {mensagem && (
  <div
    className={
      mensagem.startsWith('Erro')
        ? 'message error'
        : 'message success'
    }
  >
    {mensagem.startsWith('Erro') ? '⚠️ ' : '✓ '}
    {mensagem}
  </div>
)}

        </section>

        {/* CATEGORIAS */}

        <section className="card">

          <h2>
            Categorias
          </h2>

          {categorias.length === 0 ? (

            <div className="empty">
              Nenhum gasto neste mês.
            </div>

          ) : (

            categorias.map(
              (item) => {

                const cor =
                  CORES[item.nome] ||
                  '#b8bec8'

                return (

                  <div
                    className="category"
                    key={item.nome}
                  >

                    <div className="category-head">

                      <div className="category-name">

                        <span
                          className="dot"
                          style={{
                            background:
                              cor,
                          }}
                        />

                        {item.nome}

                      </div>

                      <div className="category-value">

                        <strong>
                          {formatarMoeda(
                            item.total
                          )}
                        </strong>

                        <span>
                          {item.percentual
                            .toFixed(1)
                            .replace(
                              '.',
                              ','
                            )}
                          %
                        </span>

                      </div>

                    </div>

                    <div className="bar">

                      <div
                        className="bar-fill"
                        style={{
                          width:
                            `${item.percentual}%`,
                          background:
                            cor,
                        }}
                      />

                    </div>

                  </div>

                )
              }
            )

          )}

        </section>

        {/* LANÇAMENTOS */}

        <section className="card">

          <h2>
            Lançamentos
          </h2>

          {carregandoDados ? (

            <div className="empty">
              Carregando lançamentos...
            </div>

          ) : (

            <>

              <StatementSection
                title="Entradas"
                items={entradas}
                formatarMoeda={
                  formatarMoeda
                }
                formatarData={
                  formatarData
                }
                iniciarEdicao={
                  iniciarEdicao
                }
                excluirLancamento={
                  excluirLancamento
                }
              />

              <StatementSection
                title="Despesas Fixas"
                items={fixas}
                formatarMoeda={
                  formatarMoeda
                }
                formatarData={
                  formatarData
                }
                iniciarEdicao={
                  iniciarEdicao
                }
                excluirLancamento={
                  excluirLancamento
                }
              />

              <StatementSection
                title="Variáveis"
                items={variaveis}
                formatarMoeda={
                  formatarMoeda
                }
                formatarData={
                  formatarData
                }
                iniciarEdicao={
                  iniciarEdicao
                }
                excluirLancamento={
                  excluirLancamento
                }
              />

            </>

          )}

        </section>

        {/* PANORAMA ANUAL */}

        <PanoramaAnual
          lancamentos={lancamentos}
          ano={Number(
            mes.slice(0, 4)
          )}
        />

      </main>

    </div>
  )
}

// =========================
// SEÇÃO DE LANÇAMENTOS
// =========================

function StatementSection({
  title,
  items,
  formatarMoeda,
  formatarData,
  iniciarEdicao,
  excluirLancamento,
}) {
  return (

    <div className="statement-section">

      <h3>
        {title}
      </h3>

      {items.length === 0 ? (

        <div className="empty small-empty">
          Nenhum lançamento.
        </div>

      ) : (

        items.map((item) => (

          <div
            className="transaction"
            key={item.id}
          >

            <div className="transaction-info">

              <strong>
                {item.descricao}
              </strong>

              <small>
                {formatarData(
                  item.data
                )}
                {' · '}
                {item.categoria}
              </small>

            </div>

            <div
              className={
                `transaction-value ${
                  item.tipo === 'entrada'
                    ? 'green'
                    : 'red'
                }`
              }
            >
              {item.tipo === 'entrada'
                ? '+'
                : '−'}

              {formatarMoeda(
                item.valor
              )}

            </div>

            <div className="transaction-actions">

              <button
                className="edit"
                onClick={() =>
                  iniciarEdicao(item)
                }
              >
                ✎
              </button>

              <button
                className="delete"
                onClick={() =>
                  excluirLancamento(
                    item.id
                  )
                }
              >
                ×
              </button>

            </div>

          </div>

        ))

      )}

    </div>
  )
}

export default App
