# SimpleTable

Documentation is available in the following languages:  
A documentação está disponível nos seguintes idiomas:  
La documentación está disponible en los siguientes idiomas:  

- [English](#English)
- [Português](#Português)
- [Español](#Español)

# English

The SimpleTable library was created to standardize and streamline the creation of tables quickly, easily, and efficiently. It is ideal for creating static and dynamic tables with search and pagination features.

## Importing the Module

The main file of the module should import the SimpleTable library script from its folder. When importing, it's necessary to declare the script with the type="module" attribute.

```html
<script type="module" src="pg/fila_simpletable/js/fila.js"></script>
```

At the beginning of the JS file of your page, import the resources that will be used in the creation of the tables.

```javascript
import { SimpleTable } from '../../../js/SimpleTable/js/SimpleTable_class.js';

$(document).ready(function () {
    // Your code here
});
```
After this process, the library will be ready to use for creating tables.

## Static Tables

Static tables are ideal for menus where the entire list of data is loaded at once, without needing to reload the page. This model is recommended for smaller lists that do not undergo constant changes, such as document lists.

## Usage Example

To use this listing, obtain all the data on the front-end, as everything will be listed and reorganized according to the use of the table.

```javascript
$.ajax({
    type: "POST",
    url: "your_file_url.php",
    data: {"your_payload": "payload_value"},
    dataType: "json",
    success: function (response) {
        let staticTable = new SimpleTable(
            processarDados(response),
            '#tabela_fila',
            '#pesquisa',
            false,
            null
        );
    }
});

function processarDados(content) {
    return content.dados.map(function (e) {
        return [
            e.Data1,
            e.Data2,
            moment(e.Date1).format('DD/MM/YYYY'),
            e.Time1,
            e.Data3,
            e.Data4,
            e.Data5,
            e.Data6,
            'UBS Name',
            `<div class="d-flex flex-column">
                <button class="btn btn-info mb-2">Audit</button>
                <button class="btn btn-secondary mb-2">Print</button>
                <button class="btn btn-primary">Manage</button>
            </div>`
        ];
    });
}

```

### SimpleTable Function Parameters

```javascript
let staticTable = new SimpleTable(
    processarDados(response), // Processed data that will fill the table
    '#tabela_fila', // HTML element (must already be created)
    '#pesquisa', // Search mechanism in the table (with searchbar class)
    false, // Whether the table will be dynamic or not
    null // Load URL if the table is dynamic
);
```

## Dynamic Tables

Dynamic tables change their content based on the page change or searched term, unlike static tables that only hide non-visible data.

### Configuration Example

```javascript
let dynamicTable = new SimpleTable(
    null, // Set to null as the data will come from the back-end in a paginated manner
    '#tabela_fila', // HTML element (must already be created)
    '#search', // Search mechanism in the table (with searchbar class)
    true, // Define the table as dynamic
    'pg/fila_simpletable/load/load_fila.php', // Path to the load script
    null // Payload to be sent (recommended to use a class as a parameter)
);
```

### Load File Adjustment

```php
<?php
include '../../../connect.php'; // Database connection

$search = $_POST['search'] ?? '';
$page = $_POST['page'] ?? 1;
$itemsPerPage = 10;
$offset = ($page - 1) * $itemsPerPage;

$conditions = [];
$words = explode(' ', $search);

foreach ($words as $key => $value) {
    if (!empty($value)) {
        $temp_string = "(";
        if (is_numeric($value)) {
            $temp_string .= "sc.Data1 = $value OR sc.Data2 = $value";
        } else {
            $temp_string .= "pref.Data3 LIKE '%$value%' OR ep.Data4 LIKE '%$value%' ";
        }
        $temp_string .= ")";
        $conditions[$key] = $temp_string;
    }
}

$conditions = !empty($search) ? " WHERE " . implode(" AND ", $conditions) : "";

if ($page == 1) {
    $countQuery = "SELECT COUNT(sc.Data1) as qtd FROM table1 sc INNER JOIN table2 ac ON sc.Data1 = ac.OtherData $conditions";
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $countData = $countResult->fetch_assoc();
    $totalRecords = $countData['qtd'];
}

$qry = "SELECT -- fields of your query FROM table1 sc -- your JOINS $conditions LIMIT $itemsPerPage OFFSET $offset";
$stmt = $db->prepare($qry); 

if ($stmt->execute()) {
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $data[] = array(
            $row['Data1'],
            $row['Data2'],
            date("d/m/Y", strtotime($row['Date1'])),
            $row['Time'],
            $row['Data3'],
            $row['Data4'],
            $row['Data5'],
            $row['Data6'],
            'Fixed String',
            '<div class="d-flex flex-column"><button class="btn btn-info btn-sm">Audit</button></div>',
            '<div class="d-flex flex-column"><button class="btn btn-secondary btn-sm">Print</button></div>',
            '<div class="d-flex flex-column"><button class="btn btn-primary btn-sm">Manage</button></div>'
        );
    }

    $numberPages = ($page == 1) ? ceil($totalRecords / $itemsPerPage) : false;

    echo json_encode([
        'msg' => 'Data loaded successfully.',
        'status' => 'success',
        'data' => $data,
        'numpaginas' => $numberPages,
        'page' => $page,
        'query' => $qry
    ]);
} else {
    echo json_encode(['msg' => 'Error querying data.', 'status' => 'error']);
}

$stmt->close(); // Close the statement
$db->close(); // Close the database connection
```

### Payload

Using payloads allows passing the necessary parameters to the backend in dynamic tables. Sending the payload data is based on the selector chosen by the user; it is generally recommended to use classes to send data to the backend.

#### Example of Use with Payload

```javascript
let dynamicTable = new SimpleTable(
    null, // Using null here is necessary, as the data will come from the back-end in a paginated manner
    '#example_table', // HTML element (must already be created)
    '#search', // Search mechanism in the table (with searchbar class)
    true, // Define the table as dynamic
    'pg/fila_simpletable/load/load_fila.php', // Path to the load script
    '.payload' // Payload to be sent (recommended to use a class as a parameter, but any selector will be accepted)
);
```

### Return

When specific data needs to be accessed in the frontend of a dynamic table, a return can be defined for an external element to the referenced table in the instance creation.

```php
$numberPages = ($page == 1) ? ceil($totalRecords / $itemsPerPage) : false;
{
    //...

    echo json_encode([
        'msg' => 'Data loaded successfully.',
        'status' => 'success',
        'data' => $data,
        'numpaginas' => $numberPages ?? 0,
        'page' => $page ?? 0,
        'retorno' => currency($totalValue) // In the return, we can define the information that will be used externally to the component
    ]);
} else {
    echo json_encode(['msg' => 'No data found.', 'status' => 'success', 'data' => null]);
}
```

In the front-end, the values defined in the response can be accessed through a custom event. Below is an example of usage:

````javascript
    $(document).on('retornoChanged', function (event, newValue) {
    if (newValue != null) {
        $("#totalValue").html(`${newValue}`);
    } else {
        $("#totalValue").empty();
    }
});
````

## License

The use of the SimpleTable library is permitted as long as proper credit is given to the original author. Please include a reference to this library in your documentation or source code, as shown in the example below:

```
// Include this notice in your source code
This software uses the SimpleTable library created by João Victor de Oliveira Martins (JVOMartins).
```

For more details, refer to the LICENSE.txt file provided with this software.

# Português

A biblioteca SimpleTable foi criada para padronizar e agilizar a criação de tabelas de maneira rápida, fácil e eficiente. Ideal para criar tabelas estáticas e dinâmicas com recursos de pesquisa e paginação.

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

As tabelas estáticas são ideais para menus onde toda a listagem de dados é carregada de uma vez, sem necessidade de recarregar a página. Esse modelo é indicado para listagens menores e que não sofrem alterações constantes, como listas de documentos, por exemplo.

### Exemplo de Uso

Para utilizar essa listagem, obtenha todos os dados no front-end, pois todos serão listados e reorganizados conforme a utilização da tabela.

```javascript
$.ajax({
    type: "POST",
    url: "url_do_seu_arquivo_.php",
    data: {"sua_payload": "valor_da_payload"},
    dataType: "json",
    success: function (response) {
        let tabelaEstatica = new SimpleTable(
            processarDados(response),
            '#tabela_fila',
            '#pesquisa',
            false,
            null
        );
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
let tabelaEstatica = new SimpleTable(
    processarDados(response), // Dados tratados que preencherão a tabela
    '#tabela_fila', // Elemento HTML (já deve estar criado)
    '#pesquisa', // Mecanismo de pesquisa na tabela (com classe searchbar)
    false, // Se a tabela será dinâmica ou não
    null // URL do load caso a tabela seja dinâmica
);
```

## Tabelas Dinâmicas

As tabelas dinâmicas alteram seu conteúdo conforme a alteração da página ou termo pesquisado. Diferente da estática, que só oculta os dados não visualizados.

### Exemplo de Configuração

```javascript
let tabelaDinamica = new SimpleTable(
    null, // Define como null, pois os dados virão do back-end de maneira paginada
    '#tabela_fila', // Elemento HTML (já deve estar criado)
    '#pesquisa', // Mecanismo de pesquisa na tabela (com classe searchbar)
    true, // Define a tabela como dinâmica
    'pg/fila_simpletable/load/load_fila.php', // Caminho do load
    null // Payload que será enviada (recomendo usar classe como parâmetro)
);
```

### Ajuste do Arquivo de Load

```php
<?php
include '../../../conecta.php'; // Conexão com o banco de dados importada

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

$stmt->close(); // Encerre o uso do método stmt
$db->close(); // Feche sua conexão com o banco de dados
```

### Payload

O uso de payloads possibilita passar os parâmetros necessários para o back-end em tabelas dinâmicas. O envio dos dados da payload é baseado no seletor escolhido pelo usuário, normalmente, recomendo o uso de classes para enviar os dados para o back-end.

#### Exemplo de Uso com Payload

```javascript
let tabelaDinamica = new SimpleTable(
    null, // O uso de null aqui é necessário, pois os dados virão do back-end de maneira paginada
    '#tabela_exemplo', // Elemento HTML (já deve estar criado)
    '#pesquisa', // Mecanismo de pesquisa na tabela (com classe searchbar)
    true, // Define a tabela como dinâmica
    'pg/fila_simpletable/load/load_fila.php', // Caminho do load
    '.payload' // Payload que será enviada (recomendo usar classe como parâmetro, mas qualquer seletor será aceito)
);
```

### Retorno

Quando algum dado específico precisa ser acessado no front-end de uma tabela dinâmica, é possível definir um retorno para um elemento externo à tabela referenciada na criação da instância.

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
        'retorno' => moeda($valorTotal) // No retorno podemos definir as informações que serão utilizadas de maneira externa ao componente
    ]);
} else {
    echo json_encode(['msg' => 'Nenhum dado foi encontrado.', 'status' => 'success', 'dados' => null]);
}
```

No front-end, os valores definidos no response podem ser acessados através de um evento personalizado. A seguir o exemplo da utilização:

````javascript
    $(document).on('retornoChanged', function (event, newValue) {
    if (newValue != null) {
        $("#valorTotal").html(`${newValue}`);
    } else {
        $("#valorTotal").empty();
    }
});
````

## Licença

O uso da biblioteca SimpleTable é permitido desde que seja dado o devido crédito ao autor original. Por favor, inclua uma referência a esta biblioteca em sua documentação ou no seu código-fonte, conforme o exemplo abaixo:

```
// Inclua este aviso em seu código-fonte
Este software utiliza a biblioteca SimpleTable criada por João Victor de Oliveira Martins (JVOMartins).
```

Para mais detalhes, consulte o arquivo LICENSE.txt fornecido com este software.

# Español

La biblioteca SimpleTable fue creada para estandarizar y agilizar la creación de tablas de manera rápida, fácil y eficiente. Es ideal para crear tablas estáticas y dinámicas con funciones de búsqueda y paginación.

## Importación del Módulo

El archivo principal del módulo debe importar el script de la biblioteca SimpleTable desde su carpeta. Al realizar la importación, es necesario declarar el script con la propiedad type="module".

```html
<script type="module" src="pg/fila_simpletable/js/fila.js"></script>
```

Al comienzo del archivo JS de su página, importe los recursos que se utilizarán en la creación de las tablas.

```javascript
import { SimpleTable } from '../../../js/SimpleTable/js/SimpleTable_class.js';

$(document).ready(function () {
    // Su código aquí
});
```

Después de este proceso, la biblioteca estará lista para usarse en la creación de tablas.

## Tablas Estáticas

Las tablas estáticas son ideales para menús donde toda la lista de datos se carga de una vez, sin necesidad de recargar la página. Este modelo es recomendado para listas más pequeñas que no sufren cambios constantes, como listas de documentos.

### Ejemplo de Uso

Para utilizar esta lista, obtenga todos los datos en el front-end, ya que todos serán listados y reorganizados según el uso de la tabla.

```javascript
$.ajax({
    type: "POST",
    url: "url_de_tu_archivo.php",
    data: {"tu_payload": "valor_del_payload"},
    dataType: "json",
    success: function (response) {
        let tablaEstatica = new SimpleTable(
            processarDados(response),
            '#tabela_fila',
            '#pesquisa',
            false,
            null
        );
    }
});

function processarDados(dados) {
    return dados.dados.map(function (e) {
        return [
            e.Dato1,
            e.Dato2,
            moment(e.Fecha1).format('DD/MM/YYYY'),
            e.Hora1,
            e.Dato3,
            e.Dato4,
            e.Dato5,
            e.Dato6,
            'Nombre UBS',
            `<div class="d-flex flex-column">
                <button class="btn btn-info mb-2">Auditoría</button>
                <button class="btn btn-secondary mb-2">Imprimir</button>
                <button class="btn btn-primary">Gestionar</button>
            </div>`
        ];
    });
}

```

### Parámetros de la Función SimpleTable

```javascript
let tablaEstatica = new SimpleTable(
    processarDados(response), // Datos procesados que llenarán la tabla
    '#tabela_fila', // Elemento HTML (ya debe estar creado)
    '#pesquisa', // Mecanismo de búsqueda en la tabla (con clase searchbar)
    false, // Si la tabla será dinámica o no
    null // URL de carga si la tabla es dinámica
);
```

## Tablas Dinámicas

Las tablas dinámicas cambian su contenido según el cambio de página o término de búsqueda. A diferencia de las estáticas, que solo ocultan los datos no visualizados.

### Ejemplo de Configuración

```javascript
let tablaDinamica = new SimpleTable(
    null, // Establecer como null, ya que los datos vendrán del back-end de manera paginada
    '#tabla_fila', // Elemento HTML (ya debe estar creado)
    '#busqueda', // Mecanismo de búsqueda en la tabla (con clase searchbar)
    true, // Define la tabla como dinámica
    'pg/fila_simpletable/load/load_fila.php', // Ruta al script de carga
    null // Payload que se enviará (recomiendo usar una clase como parámetro)
);
```

### Ajuste del Archivo de Carga

```php
<?php
include '../../../conecta.php'; // Conexión con la base de datos

$busqueda = $_POST['busqueda'] ?? '';
$pagina = $_POST['pagina'] ?? 1;
$itemsPorPagina = 10;
$offset = ($pagina - 1) * $itemsPorPagina;

$condiciones = [];
$palabras = explode(' ', $busqueda);

foreach ($palabras as $key => $value) {
    if (!empty($value)) {
        $temp_string = "(";
        if (is_numeric($value)) {
            $temp_string .= "sc.Dato1 = $value OR sc.Dato2 = $value";
        } else {
            $temp_string .= "pref.Dato3 LIKE '%$value%' OR ep.Dato4 LIKE '%$value%' ";
        }
        $temp_string .= ")";
        $condiciones[$key] = $temp_string;
    }
}

$condiciones = !empty($busqueda) ? " WHERE " . implode(" AND ", $condiciones) : "";

if ($pagina == 1) {
    $countQuery = "SELECT COUNT(sc.Dato1) as qtd FROM table1 sc INNER JOIN table2 ac ON sc.Dato1 = ac.OtroDato $condiciones";
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $countData = $countResult->fetch_assoc();
    $totalRegistros = $countData['qtd'];
}

$qry = "SELECT -- campos de tu consulta FROM table1 sc -- tus JOINS $condiciones LIMIT $itemsPorPagina OFFSET $offset";
$stmt = $db->prepare($qry); 

if ($stmt->execute()) {
    $resultado = $stmt->get_result();
    while ($row = $resultado->fetch_assoc()) {
        $datos[] = array(
            $row['Dato1'],
            $row['Dato2'],
            date("d/m/Y", strtotime($row['Fecha1'])),
            $row['Hora'],
            $row['Dato3'],
            $row['Dato4'],
            $row['Dato5'],
            $row['Dato6'],
            'Cadena Fija',
            '<div class="d-flex flex-column"><button class="btn btn-info btn-sm">Auditoría</button></div>',
            '<div class="d-flex flex-column"><button class="btn btn-secondary btn-sm">Imprimir</button></div>',
            '<div class="d-flex flex-column"><button class="btn btn-primary btn-sm">Gestionar</button></div>'
        );
    }

    $numeroPaginas = ($pagina == 1) ? ceil($totalRegistros / $itemsPorPagina) : false;

    echo json_encode([
        'msg' => 'Datos cargados con éxito.',
        'status' => 'success',
        'datos' => $datos,
        'numpaginas' => $numeroPaginas,
        'pagina' => $pagina,
        'query' => $qry
    ]);
} else {
    echo json_encode(['msg' => 'Error al consultar los datos.', 'status' => 'error']);
}

$stmt->close(); // Cerrar la declaración
$db->close(); // Cerrar la conexión a la base de datos
```

### Payload

El uso de payloads permite pasar los parámetros necesarios al back-end en tablas dinámicas. El envío de los datos de la payload se basa en el selector elegido por el usuario; normalmente, se recomienda usar clases para enviar datos al back-end.

#### Ejemplo de Uso con Payload

```javascript
let tablaDinamica = new SimpleTable(
    null, // El uso de null aquí es necesario, ya que los datos vendrán del back-end de manera paginada
    '#tabla_ejemplo', // Elemento HTML (ya debe estar creado)
    '#busqueda', // Mecanismo de búsqueda en la tabla (con clase searchbar)
    true, // Define la tabla como dinámica
    'pg/fila_simpletable/load/load_fila.php', // Ruta al script de carga
    '.payload' // Payload que se enviará (recomiendo usar una clase como parámetro, pero se aceptará cualquier selector)
);
```

### Retorno

Cuando se necesita acceder a datos específicos en el front-end de una tabla dinámica, es posible definir un retorno para un elemento externo a la tabla referenciada al crear la instancia.

```php
$numeroPaginas = ($pagina == 1) ? ceil($totalRegistros / $itemsPorPagina) : false;
{
    //...

    echo json_encode([
        'msg' => 'Datos cargados con éxito.',
        'status' => 'success',
        'datos' => $datos,
        'numpaginas' => $numeroPaginas ?? 0,
        'pagina' => $pagina ?? 0,
        'retorno' => moneda($valorTotal) // En el retorno podemos definir la información que se utilizará de manera externa al componente
    ]);
} else {
    echo json_encode(['msg' => 'No se encontraron datos.', 'status' => 'success', 'datos' => null]);
}
```

En el front-end, los valores definidos en la respuesta pueden ser accedidos a través de un evento personalizado. A continuación, un ejemplo de uso:

````javascript
    $(document).on('retornoChanged', function (event, newValue) {
    if (newValue != null) {
        $("#valorTotal").html(`${newValue}`);
    } else {
        $("#valorTotal").empty();
    }
});
````

## Licencia

El uso de la biblioteca SimpleTable está permitido siempre que se dé el debido crédito al autor original. Por favor, incluya una referencia a esta biblioteca en su documentación o en su código fuente, como se muestra en el ejemplo a continuación:

```
// Incluya este aviso en su código fuente
Este software utiliza la biblioteca SimpleTable creada por João Victor de Oliveira Martins (JVOMartins).
```

Para más detalles, consulte el archivo LICENSE.txt proporcionado con este software.