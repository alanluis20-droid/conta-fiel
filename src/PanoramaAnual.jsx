import { useMemo } from 'react'

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

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

function moeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor) || 0)
}

function valorCompacto(valor) {
  const n = Number(valor) || 0

  if (Math.abs(n) >= 1000) {
    return `${(n / 1000).toFixed(1).replace('.', ',')}k`
  }

  return String(Math.round(n))
}

function pontosGrafico(valores, largura = 420, altura = 180) {
  const max = Math.max(...valores, 1)
  const min = Math.min(...valores, 0)
  const intervalo = max - min || 1

  return valores.map((valor, index) => {
    const x =
      valores.length === 1
        ? largura / 2
        : (index / (valores.length - 1)) * largura

    const y =
      altura -
      ((valor - min) / intervalo) * altura

    return { x, y }
  })
}

function linhaSVG(pontos) {
  return pontos
    .map((ponto, index) =>
      `${index === 0 ? 'M' : 'L'} ${ponto.x} ${ponto.y}`
    )
    .join(' ')
}

export default function PanoramaAnual({
  lancamentos,
  ano,
}) {
  const dadosAno = useMemo(() => {
    return lancamentos.filter(
      item =>
        item.data.slice(0, 4) === String(ano)
    )
  }, [lancamentos, ano])

  // =========================
  // TOTAIS
  // =========================

  const entradas = dadosAno
    .filter(item => item.tipo === 'entrada')
    .reduce(
      (total, item) =>
        total + Number(item.valor),
      0
    )

  // Total de TODAS as saídas.
  // Reserva e Dívidas também são saídas.
  const despesas = dadosAno
    .filter(item => item.tipo === 'saida')
    .reduce(
      (total, item) =>
        total + Number(item.valor),
      0
    )

  // Total destinado à Reserva.
  const futuro = dadosAno
    .filter(
      item =>
        item.tipo === 'saida' &&
        item.categoria === 'Reserva'
    )
    .reduce(
      (total, item) =>
        total + Number(item.valor),
      0
    )

  // Total destinado a Dívidas.
  const dividas = dadosAno
    .filter(
      item =>
        item.tipo === 'saida' &&
        item.categoria === 'Dívidas'
    )
    .reduce(
      (total, item) =>
        total + Number(item.valor),
      0
    )

  // ==================================================
  // REGRA:
  //
  // Total de Saídas =
  // Estilo de Vida + Dívidas + Reserva
  //
  // Portanto:
  //
  // Estilo de Vida =
  // Total de Saídas - Dívidas - Reserva
  // ==================================================

  const estiloDeVida =
    despesas - futuro - dividas

  // ==================================================
  // SALDO:
  //
  // Entradas - Total de Saídas
  // ==================================================

  const saldoAnual =
    entradas - despesas

  // =========================
  // DADOS MENSAIS
  // =========================

  const dadosMensais = useMemo(() => {
    let acumulado = 0

    return MESES.map((_, indice) => {
      const mesNumero =
        String(indice + 1).padStart(2, '0')

      const chave =
        `${ano}-${mesNumero}`

      const registros =
        dadosAno.filter(
          item =>
            item.data.slice(0, 7) === chave
        )

      const entrada =
        registros
          .filter(
            item =>
              item.tipo === 'entrada'
          )
          .reduce(
            (total, item) =>
              total + Number(item.valor),
            0
          )

      // Todas as saídas entram aqui,
      // inclusive Reserva e Dívidas.
      const saida =
        registros
          .filter(
            item =>
              item.tipo === 'saida'
          )
          .reduce(
            (total, item) =>
              total + Number(item.valor),
            0
          )

      acumulado +=
        entrada - saida

      return {
        entrada,
        saida,
        saldo: entrada - saida,
        acumulado,
      }
    })
  }, [dadosAno, ano])

  // =========================
  // CATEGORIAS
  // =========================

  const categorias = useMemo(() => {
    const mapa = {}

    dadosAno
      .filter(
        item =>
          item.tipo === 'saida'
      )
      .forEach(item => {
        mapa[item.categoria] =
          (mapa[item.categoria] || 0) +
          Number(item.valor)
      })

    return Object.entries(mapa)
      .sort(
        (a, b) => b[1] - a[1]
      )
  }, [dadosAno])

  // =========================
  // GRÁFICOS
  // =========================

  const entradasMensais =
    dadosMensais.map(
      item => item.entrada
    )

  const despesasMensais =
    dadosMensais.map(
      item => item.saida
    )

  const acumulados =
    dadosMensais.map(
      item => item.acumulado
    )

  const pontosEntrada =
    pontosGrafico(
      entradasMensais
    )

  const pontosDespesa =
    pontosGrafico(
      despesasMensais
    )

  const pontosAcumulado =
    pontosGrafico(
      acumulados
    )

  const maiorCategoria =
    categorias.length
      ? categorias[0][1]
      : 0

  // ==================================================
  // DESTINO DO DINHEIRO
  //
  // As três categorias fecham exatamente o total
  // de saídas:
  //
  // Estilo de Vida
  // + Futuro (Reserva)
  // + Dívidas
  // = Total de Saídas
  // ==================================================

  const destino = [
    {
      nome: 'Estilo de Vida',
      valor: estiloDeVida,
      cor: '#e8a6a6',
    },
    {
      nome: 'Futuro (Reserva)',
      valor: futuro,
      cor: '#a9c7e5',
    },
    {
      nome: 'Dívidas',
      valor: dividas,
      cor: '#e4c18e',
    },
  ]

  const totalDestino =
    estiloDeVida +
    futuro +
    dividas

  return (
    <section className="annual-panel">

      {/* CABEÇALHO */}

      <div className="annual-top">

        <div>
          <h2>
            Panorama Anual
          </h2>

          <p>
            Visão consolidada de {ano}
          </p>
        </div>

        <div className="annual-year">
          {ano}
        </div>

      </div>

      {/* CARDS */}

      <div className="annual-summary">

        <div className="annual-card blue-card">
          <span>Entradas no ano</span>

          <strong className="green">
            {moeda(entradas)}
          </strong>
        </div>

        <div className="annual-card red-card">
          <span>Estilo de Vida</span>

          <strong className="red">
            {moeda(estiloDeVida)}
          </strong>
        </div>

        <div className="annual-card light-blue-card">
          <span>Futuro (Reserva)</span>

          <strong>
            {moeda(futuro)}
          </strong>
        </div>

        <div className="annual-card green-card">
          <span>Saldo anual atualizado</span>

          <strong
            className={
              saldoAnual >= 0
                ? 'green'
                : 'red'
            }
          >
            {moeda(saldoAnual)}
          </strong>
        </div>

      </div>

      {/* GRÁFICOS PRINCIPAIS */}

      <div className="annual-charts">

        {/* EVOLUÇÃO MENSAL */}

        <div className="annual-chart-card">

          <h3>
            Evolução mensal
          </h3>

          <div className="chart-wrapper">

            <svg
              viewBox="0 0 420 220"
              preserveAspectRatio="none"
            >

              {[0, 1, 2, 3].map(
                linha => (
                  <line
                    key={linha}
                    x1="0"
                    x2="420"
                    y1={linha * 60 + 10}
                    y2={linha * 60 + 10}
                    stroke="#e8edf2"
                    strokeWidth="1"
                  />
                )
              )}

              <path
                d={linhaSVG(
                  pontosEntrada
                )}
                fill="none"
                stroke="#16a05d"
                strokeWidth="3"
              />

              <path
                d={linhaSVG(
                  pontosDespesa
                )}
                fill="none"
                stroke="#dc2626"
                strokeWidth="3"
              />

              {pontosEntrada.map(
                (ponto, i) => (
                  <circle
                    key={`e${i}`}
                    cx={ponto.x}
                    cy={ponto.y}
                    r="4"
                    fill="#16a05d"
                  />
                )
              )}

              {pontosDespesa.map(
                (ponto, i) => (
                  <circle
                    key={`d${i}`}
                    cx={ponto.x}
                    cy={ponto.y}
                    r="4"
                    fill="#dc2626"
                  />
                )
              )}

            </svg>

          </div>

          <div className="chart-months">
            {MESES.map(
              mes => (
                <span key={mes}>
                  {mes}
                </span>
              )
            )}
          </div>

          <div className="chart-legend">

            <span>
              <i className="legend-green" />
              Entradas
            </span>

            <span>
              <i className="legend-red" />
              Despesas
            </span>

          </div>

        </div>

        {/* SALDO ACUMULADO */}

        <div className="annual-chart-card">

          <h3>
            Saldo acumulado
          </h3>

          <div className="chart-wrapper">

            <svg
              viewBox="0 0 420 220"
              preserveAspectRatio="none"
            >

              {[0, 1, 2, 3].map(
                linha => (
                  <line
                    key={linha}
                    x1="0"
                    x2="420"
                    y1={linha * 60 + 10}
                    y2={linha * 60 + 10}
                    stroke="#e8edf2"
                    strokeWidth="1"
                  />
                )
              )}

              <path
                d={linhaSVG(
                  pontosAcumulado
                )}
                fill="none"
                stroke="#4d9be8"
                strokeWidth="3"
              />

              {pontosAcumulado.map(
                (ponto, i) => (
                  <circle
                    key={i}
                    cx={ponto.x}
                    cy={ponto.y}
                    r="4"
                    fill="#4d9be8"
                  />
                )
              )}

            </svg>

          </div>

          <div className="chart-months">
            {MESES.map(
              mes => (
                <span key={mes}>
                  {mes}
                </span>
              )
            )}
          </div>

        </div>

        {/* DESTINO */}

        <div className="annual-chart-card">

          <h3>
            Destino do dinheiro
          </h3>

          {destino.map(item => {

            const percentual =
              despesas > 0
                ? (item.valor / despesas) * 100
                : 0

            const largura =
              totalDestino > 0
                ? (item.valor / totalDestino) * 100
                : 0

            return (
              <div
                className="destination"
                key={item.nome}
              >

                <div className="destination-head">

                  <strong>
                    {item.nome}
                  </strong>

                  <span>
                    {percentual
                      .toFixed(1)
                      .replace('.', ',')}
                    %
                  </span>

                </div>

                <div className="destination-bar">

                  <div
                    style={{
                      width:
                        `${largura}%`,
                      background:
                        item.cor,
                    }}
                  />

                </div>

                <div className="destination-value">
                  {moeda(item.valor)}
                </div>

              </div>
            )
          })}

        </div>

      </div>

      {/* MAIORES DESPESAS */}

      <div className="annual-ranking">

        <h3>
          Maiores despesas do ano
        </h3>

        {categorias.length === 0 ? (

          <div className="annual-empty">
            Nenhuma despesa registrada em {ano}.
          </div>

        ) : (

          categorias.map(
            ([nome, total]) => {

              const percentual =
                despesas > 0
                  ? (total / despesas) * 100
                  : 0

              const largura =
                maiorCategoria > 0
                  ? (total / maiorCategoria) * 100
                  : 0

              const cor =
                CORES[nome] ||
                '#b8bec8'

              return (
                <div
                  className="ranking-row"
                  key={nome}
                >

                  <div className="ranking-name">

                    <span
                      style={{
                        background: cor,
                      }}
                    />

                    {nome}

                  </div>

                  <div className="ranking-bar">

                    <div
                      style={{
                        width:
                          `${largura}%`,
                        background: cor,
                      }}
                    />

                  </div>

                  <strong>
                    {moeda(total)}
                  </strong>

                  <span className="ranking-percent">
                    {percentual
                      .toFixed(1)
                      .replace('.', ',')}
                    %
                  </span>

                </div>
              )
            }
          )

        )}

      </div>

    </section>
  )
}
