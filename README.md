# SimpleTable

A biblioteca SimpleTable foi criada para padronizar e agilizar a criação de tabelas.

## Importação do Módulo

O arquivo principal do módulo deve importar o script da biblioteca SimpleTable de sua pasta. Ao realizar a importação, é necessário declarar o script com a propriedade `type="module"`.

```html
<script type="module" src="pg/fila_simpletable/js/fila.js"></script>
```

No início do arquivo JS da sua página, importe os recursos que serão utilizados na criação das tabelas.

```javascript
import { SimpleTable } from '../../../js/SimpleTable/js/SimpleTable_class.js';

$(document).ready(function () {
    // Seu código aqui
});
```

Após esse processo, a biblioteca estará pronta para ser utilizada na criação de tabelas.

## Tabelas Estáticas

As tabelas estáticas são ideais para menus onde toda a listagem de dados é carregada de uma vez, sem necessidade de recarregar a página. Esse modelo é indicado para listagens menores e que não sofrem alterações constantes, como agendamentos.

Para utilizar essa listagem, obtenha todos os dados no front-end, pois todos serão listados e reorganizados conforme a utilização da tabela.

```javascript
$.ajax({
    type: "POST",
    url: "url_do_seu_arquivo_.php",
    data: {"sua_payload": "valor_da_payload"},
    dataType: "json",
    success: function (response) {
        let tabela_estatica = new SimpleTable(processarDados(response), `#tabela_fila`, `#pesquisa`, false, null);
    }
});

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
            </div>`
        ];
    });
}
```

### Parâmetros da Função SimpleTable

```javascript
let tabela_estatica = new SimpleTable(
    processarDados(response), // Dados tratados que preencherão a tabela
    `#tabela_fila`, // Elemento HTML (já deve estar criado)
    `#pesquisa`, // Mecanismo de pesquisa na tabela (com classe searchbar)
    false, // Se a tabela será dinâmica ou não
    null, // URL do load caso a tabela seja dinâmica
    null // Payload que será enviada (recomendo usar classe como parâmetro)
);
```

## Tabelas Dinâmicas

As tabelas dinâmicas alteram seu conteúdo conforme a alteração da página ou termo pesquisado. Diferente da estática, que só oculta os dados não visualizados.

### Configuração da Função

```javascript
let tabela_dinamica = new SimpleTable(
    null, // Define como null, pois os dados virão do back-end de maneira paginada
    `#tabela_fila`, // Elemento HTML (já deve estar criado)
    `#pesquisa`, // Mecanismo de pesquisa na tabela (com classe searchbar)
    true, // Define a tabela como dinâmica
    'pg/fila_simpletable/load/load_fila.php', // Caminho do load
    null // Payload que será enviada (recomendo usar classe como parâmetro)
);
```

### Ajuste do Arquivo de Load

```php
<?php
include '../../../conecta.php'; //Conexão com o banco de dados importada

$pesquisa = $_POST['pesquisa'] ?? '';
$pagina = $_POST['pagina'] ?? 1;
$itensPorPagina = 10;
$offset = ($pagina - 1) * $itensPorPagina;

$condicoes = [];
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

$condicoes = !empty($pesquisa) ? " WHERE " . implode(" AND ", $condicoes) : "";

if ($pagina == 1) {
    $countQuery = "SELECT COUNT(sc.Dado1) as qtd FROM table1 sc INNER JOIN table2 ac ON sc.Dado1 = ac.OutroDado $condicoes";
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $countData = $countResult->fetch_assoc();
    $totalRegistros = $countData['qtd'];
}

$qry = "SELECT -- campos da sua query FROM table1 sc -- seus JOINS $condicoes LIMIT $itensPorPagina OFFSET $offset";
$stmt = $db->prepare($qry); 

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
            '<div class="d-flex flex-column"><button class="btn btn-primary btn-sm">Gerenciar</button></div>'
        );
    }

    $numeroPaginas = ($pagina == 1) ? ceil($totalRegistros / $itensPorPagina) : false;

    echo json_encode([
        'msg' => 'Dados carregados com sucesso.',
        'status' => 'success',
        'dados' => $dados,
        'numpaginas' => $numeroPaginas,
        'pagina' => $pagina,
        'query' => $qry
    ]);
} else {
    echo json_encode(['msg' => 'Erro ao consultar os dados.', 'status' => 'error']);
}

$stmt->close(); //Encerre o uso do método stmt
$db->close(); //Feche sua conexão com o banco de dados
```
Para garantir o funcionamento correto da biblioteca no modo dinâmico, todos os critérios acima devem ser cumpridos.

## Payload

O uso de payloads possibilita passar os parâmetros necessários para o back-end em tabelas dinâmicas. O envio dos dados da payload é baseado no seletor escolhido pelo usuário, normalmente, recomendo o uso de classes para enviar os dados para o back-end.

A seguir, um exemplo de uma tabela dinâmica com o uso de payload:

```javascript
let tabela_dinamica = new SimpleTable(
    null, // O uso de null aqui é necessário, pois os dados virão do back-end de maneira paginada
    `#tabela_exemplo`, // Elemento HTML (já deve estar criado)
    `#pesquisa`, // Mecanismo de pesquisa na tabela (com classe searchbar)
    true, // Define a tabela como dinâmica
    'pg/fila_simpletable/load/load_fila.php', // Caminho do load
    '.payload' // Payload que será enviada (recomendo usar classe como parâmetro, mas qualquer seletor será aceito)
);
```
A payload chega no back-end com base em certos atributos do elemento, no caso o name e o value. Então o elemento que contiver o seletor informado na criação da instância da tabela, deve conter nome e value, esses serão enviados como parâmetro na requisição ajax.

## Retorno

Quando algum dado específico precisa ser acessado no front-end de uma tabela dinâmica, é possível definir um retorno para um elemento externo a tabela referenciada na criação da instância.

```php
$numeroPaginas = ($pagina == 1) ? ceil($totalRegistros / $itensPorPagina) : false;
{
    //...

    echo json_encode([
        'msg' => 'Dados carregados com sucesso.',
        'status' => 'success',
        'dados' => $dados,
        'numpaginas' => $numeroPaginas ?? 0,
        'pagina' => $pagina ?? 0,
        'retorno' => moeda($valorTotal) //No retorno podemos definir as informações que serão utilizadas de maneira externa ao componente
    ]);
} else {
    echo json_encode(['msg' => 'Nenhum dado foi encontrado.', 'status' => 'success', 'dados' => null]);
}
```

No front-end os valores definidos no response podem ser acessados através de um evento personalizado. A seguir o exemplo da utilização:

````javascript
    $(document).on('retornoChanged', function (event, newValue) {
        if (newValue != null) {
            $("#valorTotal").html(`${newValue}`);
        } else {
            $("#valorTotal").empty();
        }
    });
````
Dessa maneira poderemos trabalhar com conteúdo que vem da requisição mas não será utilizado dentro do elemento Table.

## Licença

O uso da biblioteca SimpleTable é permitido desde que seja dado o devido crédito ao autor original. Por favor, inclua uma referência a esta biblioteca em sua documentação ou no seu código-fonte, conforme o exemplo abaixo:

```
// Inclua este aviso em seu código-fonte
Este software utiliza a biblioteca SimpleTable criada por João Victor de Oliveira Martins (JVOMartins).
```

Para mais detalhes, consulte o arquivo LICENSE.txt fornecido com este software.
