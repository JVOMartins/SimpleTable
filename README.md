# SimpleTable

A biblioteca SimpleTable foi criada com o intuito de padronizar e agilizar a criação de tabelas.

### Importação do módulo

O arquivo principal do módulo deve importar o script da biblioteca SimpleTable de sua pasta. Ao realizar a importação é necessário declarar o script como tendo a propriedade type=”module”.

<script type="module" src="pg/fila_simpletable/js/fila.js"></script>

No início do arquivo js da sua página, é necessário os recursos que serão utilizados na criação das tabelas.
----------------------------------------------------------------------------------------------------------------------------------------
import { SimpleTable } from '../../../js/SimpleTable/js/SimpleTable_class.js';
$(document).ready(function () {
//seu código aqui
}
----------------------------------------------------------------------------------------------------------------------------------------
Após realizado esse processo, já poderemos utilizar a biblioteca para criação de tabelas.


## Tabelas estáticas

As tabelas estáticas serão utilizadas em menus onde será interessante trazer toda a listagem de uma só vez, não se fazendo necessário que se recarregue a página para acessar determinados dados. Esse modelo deve ser utilizado para listagens menores, e que não sofrem alterações constantes, como os agendamentos, por exemplo.

Ao utilizar essa listagem, é importante que você obtenha todos os dados no front-end, pois todos eles serão listados aqui e reorganizados a medida que a tabela será utilizada.
----------------------------------------------------------------------------------------------------------------------------------------
$.ajax({
        type: "POST",
        url: "url_do_seu_arquivo_.php",
        data: {"sua_payload": "valor_da_payload"},
        dataType: "json",
        success: function (response) {
            let tabela_estatica= new SimpleTable(processarDados(response), `#tabela_fila`, `#pesquisa`, false, null);
        }
    });

//sugestão de função que pode ser utilizada para tratar seus dados
function processarDados(dados) {
    return dados.dados.map(function (e) {
        return [
            e.Dado1,
            e.Dado2,
            moment(e.Data1).format('DD/MM/YYYY'),
            e.Hora1,
            e.Dado3,
            e.Dado4,
            e.Dado5,
            e.Dado6,
            'Nome UBS',
            `<div class="d-flex flex-column">
                <button class="btn btn-info mb-2">Auditoria</button>
                <button class="btn btn-secondary mb-2">Imprimir</button>
                <button class="btn btn-primary">Gerenciar</button>
            </div>`,
        ];
    });
}
----------------------------------------------------------------------------------------------------------------------------------------

Vale lembrar que os dados devem ser enviados por parâmetro sendo tratados como array ou objeto.

Exemplificando melhor o que cada parâmetro faz na chamada da função:

----------------------------------------------------------------------------------------------------------------------------------------
let tabela_estatica = new SimpleTable(
processarDados(response), //seus dados tratados que preencherão a tabela
`#tabela_fila`, //seu elemento html (que já deve estar criado quando a função for chamada)
`#pesquisa`, //seu mecanismo de pesquisa dentro da tabela (para que tenha o estilo da biblioteca, deve conter a classe searchbar)
false, //se sua tabela será dinâmica ou não
null, //url do load caso a tabela seja dinâmica
null //payload que será enviada (recomendo usar classe como parâmetro)
); 
----------------------------------------------------------------------------------------------------------------------------------------

## Tabelas dinâmicas

As tabelas dinâmicas funcionam de maneira um pouco diferente, todo seu conteúdo é alterado conforme a alteração da página/termo pesquisado (diferente da estática que só oculta os dados não visualizados). Quanto a chamada da função, são poucas as mudanças, mas deve-se atentar a elas para que não ocorram erros.

----------------------------------------------------------------------------------------------------------------------------------------
let tabela_dinamica = new SimpleTable(
null, //deve-se definir como null, pois os dados utilizados virão do back-end
`#tabela_fila`, //seu elemento html (que já deve estar criado quando a função for chamada)
`#pesquisa`, //seu mecanismo de pesquisa dentro da tabela (para que tenha o estilo da biblioteca, deve conter a classe searchbar)
true, //define a tabela como dinâmica
'pg/fila_simpletable/load/load_fila.php', //caminho do load
null //payload que será enviada (recomendo usar classe como parâmetro)
);
----------------------------------------------------------------------------------------------------------------------------------------

Certo, nossa chamada da função no front-end está de acordo com nossa necessidade, agora só precisamos ajustar o arquivo de load corretamente.

----------------------------------------------------------------------------------------------------------------------------------------
<?php //o início do load começa como qualquer outro, com as importações necessárias
include '../../../conecta.php';

//logo após, devemos definir alguns parâmetros que a biblioteca exige
$pesquisa   = $_POST['pesquisa'] ?? '';
$pagina = $_POST['pagina'] ?? 1;
$itensPorPagina = 10;
$offset = ($pagina - 1) * $itensPorPagina;
//esses parâmetros vão servir para o sistema de paginação

//para a pesquisa, sugiro uma lógica semelhante a essa para que o termo seja pesquisado
// em qualquer campo da tabela
$condicoes;
$palavras = explode(' ', $pesquisa);

foreach ($palavras as $key => $value) {
    if(!empty($value)){
        $temp_string = "(";
        if (is_numeric($value)) {
            $temp_string .= "sc.Dado1 = $value OR sc.Dado2 = $value";
        } else {
            $temp_string .= "pref.Dado3 LIKE '%$value%' OR ep.Dado4 LIKE '%$value%' ";
        }
        $temp_string .= ")";
        $condicoes[$key] = $temp_string;
    }
}
//no trecho acima, houve separação de tipo para que uma informação que é string
//não seja procurada em uma coluna int e vice-versa

//finalizando a condicional
if(!empty($pesquisa)){
    $condicoes = " WHERE " . implode(" AND ", $condicoes);
}else{
    $condicoes = "";
}

//o trecho a seguir é necessário para que se saiba a quantidade de páginas da 
//pesquisa em questão
if ($pagina == 1) {

    $countQuery = "SELECT
                COUNT(sc.Dado1) as qtd
                FROM
                table1 sc
                INNER JOIN table2 ac ON sc.Dado1 = ac.OutroDado 
                -- seus JOINS
                $condicoes ";

    $countStmt = $db->prepare($countQuery);
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $countData = $countResult->fetch_assoc();

    $totalRegistros = $countData['qtd'];
}

//aqui a pesquisa dos dados é feita
$qry = "SELECT
    -- campos da sua query
    FROM
    table1 sc
    -- seus JOINS
    $condicoes LIMIT $itensPorPagina OFFSET $offset ";

$stmt = $db->prepare($qry);

//a seguir o tratamento dos dados e o tratamento de exceção
if ($stmt->execute()) {
    $resultado = $stmt->get_result();

    while ($row = $resultado->fetch_assoc()) {
        $dados[] = array(
                $row['Dado1'],
                $row['Dado2'],
                date("d/m/Y", strtotime($row['Data1'])),
                $row['Hora'],
                $row['Dado3'],
                $row['Dado4'],
                $row['Dado5'],
                $row['Dado6'],
                'String Fixa',
                '<div class="d-flex flex-column"><button class="btn btn-info btn-sm">Auditoria</button></div>',
                '<div class="d-flex flex-column"><button class="btn btn-secondary btn-sm">Imprimir</button></div>',
                '<div class="d-flex flex-column"><button class="btn btn-primary btn-sm">Gerenciar</button></div>',
        );
    }
//vale ressaltar que o trecho abaixo (tratamento de exceção) deve ser feito dessa
//maneira para que o a biblioteca funcione
    if ($pagina == 1) {
        $numeroPaginas = ceil($totalRegistros / $itensPorPagina ?? 10);
    } else {
        $numeroPaginas = false;
    }

    if (!empty($dados)) {
        echo json_encode(array('msg' => 'Dados carregados com sucesso.', 'status' => 'success', 'dados' => $dados, 'numpaginas' => $numeroPaginas, 'pagina' => $pagina,'query'=>$qry));
    } else {
        echo json_encode(array('msg' => 'Nenhum dado foi encontrado.', 'status' => 'error', 'dados' => $dados));
    }
} else {
    echo json_encode(array('msg' => 'Erro ao consultar os dados.', 'status' => 'error'));
}

$stmt->close();
$db->close();
----------------------------------------------------------------------------------------------------------------------------------------

Vale a pena ressaltar que não cumprindo alguns dos critérios do código acima, a biblioteca não funcionará de acordo com o esperado.

Licença
O uso da biblioteca SimpleTable é permitido desde que seja dado o devido crédito ao autor original. Por favor, inclua uma referência a esta biblioteca em sua documentação ou no seu código-fonte, conforme o exemplo abaixo:

// Inclua este aviso em seu código-fonte
Este software utiliza a biblioteca SimpleTable criada por João Victor de Oliveira Martins (JVOMartins).

Para mais detalhes, consulte o arquivo LICENSE.txt fornecido com este software.
