export class SimpleTable {
  constructor(data_array, table = "table", search_bar = "input", dinamica, url, payload_st) {
    this.data_array = data_array;
    this.tableSelector = table;
    this.theadSelector = 'thead';
    this.tbodySelector = 'tbody';
    this.tfootSelector = 'tfoot';
    this.search_barSelector = search_bar;
    this.payload_st = payload_st;

    this.dinamica = dinamica;
    this.url = url;

    this.paginaAtual = 0;
    this.totalPaginas = 0;
    this.linhasPorPagina = 10;
    this.colunas = 0;

    this.refreshing = false;
    this._retorno;

    this.carregarLodash().then(() => {

      $(`${this.tableSelector}`).hide();
      $(`${this.search_barSelector}`).hide();

      this.importarCSSSeNecessario("./assets/plugins/SimpleTable/style/style.css");

      this.importarBS();

      this.setupEventListeners();

      this.tabela();
    });

    Object.defineProperty(this, 'retorno', {
      get: () => this._retorno,
      set: (newValue) => {
        this._retorno = newValue;
        $(document).trigger('retornoChanged', [newValue]);
      }
    });

  }

  setupEventListeners() {
    const that = this;

    $(document).on("click", `${this.tableSelector} #proximo`, async function () {
      that.paginaAtual == undefined ? that.paginaAtual = 0 : null;
      if (that.paginaAtual < that.totalPaginas - 1 || that.paginaAtual < that.numPaginas_dinamicas - 1) {
        if (that.dinamica == false) {
          that.mostraPag(this.paginaAtual = that.paginaAtual = that.paginaAtual + 1);
        } else {
          let termo = $(`${that.search_barSelector}`).val();
          this.paginaAtual = that.paginaAtual = that.paginaAtual + 1;
          await that.buscarDados(that.url, { 'pesquisa': termo });
          that.tabela();
        }
      }
    });

    $(document).on("click", `${this.tableSelector} #anterior`, async function () {
      that.paginaAtual == undefined ? that.paginaAtual = 0 : null;
      if (that.paginaAtual > 0) {
        if (that.dinamica == false) {
          that.mostraPag(this.paginaAtual = that.paginaAtual = that.paginaAtual - 1);
        } else {
          let termo = $(`${that.search_barSelector}`).val();
          this.paginaAtual = that.paginaAtual = that.paginaAtual - 1;
          await that.buscarDados(that.url, { 'pesquisa': termo });
          that.tabela();
        }
      }
    });

    $(document).on("click", `${this.tableSelector} .btnpg`, async function () {
      that.paginaAtual == undefined ? that.paginaAtual = 0 : null;
      const pgAtual = $(this).data("page");
      if (!$(this).is(`${that.tableSelector} #proximo, ${that.tableSelector} #anterior`)) {
        if (that.dinamica == false) {
          that.mostraPag(this.paginaAtual = that.paginaAtual = pgAtual);
        } else {
          let termo = $(`${that.search_barSelector}`).val();
          this.paginaAtual = that.paginaAtual = pgAtual;
          await that.buscarDados(that.url, { 'pesquisa': termo });
          that.tabela();
        }
      }
    });

    $(document).on("input", `${this.search_barSelector}`, _.debounce(async () => {
      if (that.dinamica) {
        that.paginaAtual = 0;
        const termo = ($(this.search_barSelector).val() || '').toString().toLowerCase();

        const payload = {};

        payload['pesquisa'] = termo;

        await that.buscarDados(that.url, payload);
        that.tabela();
      }
    }, 1750));

  }

  mostraPag(page) {

    if (this.tbodySelector == null || this.tbodySelector == undefined) {
      this.tbodySelector = 'tbody';
    }

    if (this.dinamica == false) {
      const that = this;

      $(`${this.tableSelector} ${this.tbodySelector}:not(.pagina${page})`).fadeOut(400);

      $(`${this.tableSelector} ${this.tbodySelector}.pagina${page}`).delay(400).fadeIn(400);
    }

    this.botoesPaginacao();
  }

  botoesPaginacao() {
    const maxBotoes = 7;

    let indicesBotoes = 0;
    let numPaginas = this.totalPaginas;
    var botoesHtml;

    if (numPaginas > 0) {

      if (this.dinamica === true) {
        numPaginas = this.numPaginas_dinamicas;
        this.paginaAtual = this.pgDinamica - 1;
      }

      if (this.paginaAtual == 0) {
        if (numPaginas <= 3) {
          indicesBotoes = _.range(this.paginaAtual, numPaginas);
        } else {
          indicesBotoes = _.range(this.paginaAtual, this.paginaAtual + 3);
          indicesBotoes.push("...");
          indicesBotoes.push(numPaginas - 1);
        }
      } else {
        if (numPaginas <= 3) {
          indicesBotoes = _.range(0, numPaginas);
        } else {
          if (this.paginaAtual == numPaginas - 1) {
            indicesBotoes = _.range(this.paginaAtual - 2, numPaginas);
            indicesBotoes.unshift("...");
            indicesBotoes.unshift(0);
          } else {
            indicesBotoes = _.range(this.paginaAtual - 1, this.paginaAtual + 2);
            if (this.paginaAtual == 2) {
              indicesBotoes.unshift(0);
            }
            if (this.paginaAtual >= 3) {
              indicesBotoes.unshift("...");
              indicesBotoes.unshift(0);
            }
            if (numPaginas - 1 - this.paginaAtual != 1) {
              indicesBotoes.push("...");
              indicesBotoes.push(numPaginas - 1);
            }
          }
        }
      }

      if (!this.colunas > 0) {
        let cabecalho = $(this.tableSelector).find(`tr:first`);
        this.colunas = $(cabecalho).find("th,td").length;
      }

      botoesHtml = `<tr style="text-align-last:center;"><td colspan="${this.colunas ?? 0}"><button id="anterior" data-table="${this.tableSelector}" type="button" class="btn btn-outline-primary btn-sm mr-2 bp">&lt;</button>`;

      for (let i = 0; i < indicesBotoes.length; i++) {
        const indice = indicesBotoes[i];
        if (indice === "...") {
          botoesHtml += `<span class="pagination-ellipsis mr-2" style="color:#007bff;">&hellip;</span>`;
        } else if (indice === this.paginaAtual) {
          botoesHtml += `<button class="btn btn-primary btn-sm mr-2 is-current">${indice + 1}</button>`;
        } else {
          botoesHtml += `<button class="btn btn-outline-primary btn-sm mr-2 btnpg bp" data-table="${this.tableSelector}" data-page="${indice}">${indice + 1}</button>`;
        }
      }

      botoesHtml += `<button id="proximo" type="button" data-table="${this.tableSelector}" class="btn btn-outline-primary btn-sm bp" >&gt;</button></td></tr>`;
    } else {
      if (!this.colunas > 0) {
        let cabecalho = $(this.tableSelector).find(`tr:first`);
        this.colunas = $(cabecalho).find("th,td").length;
      }
      botoesHtml = `<tr style="text-align-last:center;"><td colspan="${this.colunas ?? 0}"><button disabled type="button" class="btn btn-outline-primary btn-sm mr-2 bp">&lt;</button>`;
      botoesHtml += `<button disabled type="button" class="btn btn-outline-primary btn-sm bp" >&gt;</button></td></tr>`;
    }

    var old_tfoot = $(`${this.tableSelector} tfoot`);
    var classes = old_tfoot.attr('class');
    var id = old_tfoot.attr('id');
    var new_tfoot = $('<tfoot>').attr('class', classes).attr('id', id).html(botoesHtml);

    $(`${this.tableSelector} tfoot`).remove();
    $(`${this.tableSelector}`).append(new_tfoot);
  }

  contemTagsHtml(texto) {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = texto;

    return tempElement.children.length > 0;
  }

  buscarDados(url, payload) {
    payload['pagina'] = this.paginaAtual + 1;
    const self = this; // Armazena a referência 'this' em 'self'

    $(`${this.payload_st}`).each(function () {
      const nomeDoElemento = $(this).attr('name');
      let valorDoElemento;

      valorDoElemento = $(this).val();

      payload[nomeDoElemento] = valorDoElemento;
    });

    return new Promise(function (resolve, reject) {
      $.ajax({
        type: "POST",
        url: url,
        data: payload,
        dataType: "json",
        success: function (response) {
          Swal.close();
          if (response.status === 'success') {
            self.data_array = response.dados;
            self.retorno = response.retorno;
            if (self.data_array == null) {
              self.data_array = null;
              self.refreshing = true;
              response.numpaginas = 0;
              self.totalPaginas = 0;
              self.pgDinamica = 1;
              self.botoesPaginacao();
              resolve(response);
              $('.bp').prop('disabled', false);
              reject(new Error('Nenhum resultado encontrado.'));
            } else {
              response.numpaginas > 0 ? self.numPaginas_dinamicas = response.numpaginas : null;
              self.totalPaginas = self.numPaginas_dinamicas;
              self.pgDinamica = response.pagina;
              response.linhasPorPagina > 0 && response.linhasPorPagina != self.linhasPorPagina ? 
              self.linhasPorPagina = response.linhasPorPagina : null;
              self.botoesPaginacao();
              resolve(response);
              $('.bp').prop('disabled', false);
            }
          } else {
            self.data_array = null;
            self.refreshing = true;
            response.numpaginas = 0;
            self.totalPaginas = 0;
            self.pgDinamica = 1;
            self.botoesPaginacao();
            resolve(response);
            $('.bp').prop('disabled', false);
            reject(new Error('Nenhum resultado encontrado.'));
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          Swal.fire({
            title: "Atenção!",
            text: "Houve um problema na requisição.",
            icon: "warning",
            allowOutsideClick: false,
            showConfirmButton: true,
          });
          reject(errorThrown);
        },
        xhr: () => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (event) => {
            const percent = (event.loaded / event.total) * 100;
            $(".progress-bar").css("width", percent + "%");
          });
          return xhr;
        },
        beforeSend: function () {
          $('.bp').prop('disabled', true);
          Swal.fire({
            title: "Carregando...",
            html: '<div class="spinner-border text-primary" role="status"><span class="sr-only">Carregando...</span></div>',
            allowOutsideClick: false,
            showConfirmButton: false,
          });
        },
      });
    });

  }

  async tabela() {
    // $(`${this.tableSelector}`).hide();

    if (this.data_array == null && this.dinamica == true) {
      if (this.refreshing == false && $(`${this.search_barSelector}`).val() == "") {
        await this.buscarDados(this.url, { 'pesquisa': '' });
      }
    }

    
    const search_bar = this.search_barSelector;

    const dados = this.data_array;
    const linhasPorPagina = this.linhasPorPagina ?? 10;
    let totalPaginas = this.totalPaginas;

    // $(search_bar).val("");
    $(search_bar).off("input.oldpesquisa");
    $(search_bar).off("input.newpesquisa");

    const filtrarEPaginar = () => {
      const termos = ($(search_bar).val() || '').toString().toLowerCase().split(" ").filter((e) => e);

      const filtrados = termos.length > 0 && !this.dinamica ? dados.filter((e) => termos.every((termo) => _.values(e).some((v) => v?.toString().toLowerCase().includes(termo)))) : dados;

      const paginasDados = _.chunk(filtrados, linhasPorPagina);

      this.totalPaginas = paginasDados.length;

      if (this.dinamica == false) {
        this.paginaAtual = 0;
      }

      this.botoesPaginacao();

      const urlParams = new URLSearchParams(window.location.search);
      const subitem = urlParams.get("i");
      let paginasTBody = [];

      if (paginasDados.length > 0) {
        paginasTBody = paginasDados.map((dados, indexPag) => {
          const linhas = Array.isArray(dados) ?
            dados.map(
              (dado) => /*html*/ `
                              <tr>
                              ${Array.isArray(dado) ?
                  dado.map((e) => `<td ${this.contemTagsHtml(e) ? '' : `title="${e}"`}>${e}</td>`).join("") :
                  Object.values(dado)
                    .map((e) => `<td ${this.contemTagsHtml(e) ? '' : `title="${e}"`}>${e}</td>`).join("")
                }
                              </tr>`
            ) :
            Object.keys(dados).map(
              (key) => /*html*/ `<tr>
                                  ${this.contemTagsHtml(dados[key]) ? dados[key] : `<td title="${dados[key]}" >${dados[key]}</td>`}
                              </tr>`
            );

          if (indexPag === 0) return /*html*/ `<tbody class="pagina${indexPag}">${linhas}</tbody>`;
          else return /*html*/ `<tbody class="pagina${indexPag}" style="display: none;">${linhas}</tbody>`;
        });
      } else {
        paginasTBody = [`<tbody class="pagina0"><tr> <td colspan="${this.colunas ?? 0}" style="text-align: center;"> Nenhum registro encontrado </td> </tr></tbody>`];
      }

      if (this.dinamica == false) {
        totalPaginas = paginasTBody.length;
        this.totalPaginas = totalPaginas;
        this.paginaAtual = this.pgDinamica;
      }

      const th = $(`${this.tableSelector} ${this.thead ?? "thead"}`);
      const tf = $(`${this.tableSelector} ${this.tfoot ?? "tfoot"}`);

      const fillTable = () => {
        $(`${this.tableSelector}`).empty();
        $(`${this.tableSelector}`).append(th);
        $(`${this.tableSelector}`).append(paginasTBody.join(""));
        if (tf !== 'tfoot') {
          $(`${this.tableSelector}`).append(tf);
        } else {
          $(`${this.tableSelector} tfoot`).remove();
          $(`${this.tableSelector}`).append(tf);
        }
        $(`${this.tableSelector}`).fadeIn(1000);
        $(`${this.search_barSelector}`).fadeIn(1000);
      };

      const page = $(`${this.tableSelector} tbody.pagina${this.paginaAtual}`);
      if (page.length) page.fadeOut(300, fillTable);
      else fillTable();
    };

    if (this.dinamica == false) {
      $(search_bar).on("input.newpesquisa", _.debounce(filtrarEPaginar, 1000));
    }
    filtrarEPaginar();

  }

  carregarLodash() {
    return new Promise(function (resolve, reject) {
      if (typeof _ !== "undefined") {
        resolve();
      } else {
        var script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      }
    });
  }

  importarCSSSeNecessario(url) {
    var folhasEstilo = document.styleSheets;
    for (var i = 0; i < folhasEstilo.length; i++) {
      if (folhasEstilo[i].href === url) {
        return;
      }
    }

    var linkCSS = document.createElement("link");
    linkCSS.rel = "stylesheet";
    linkCSS.href = url;

    // var bootstrap = document.createElement("script");
    // bootstrap.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css";
    // document.head.appendChild(bootstrap);

    document.head.appendChild(linkCSS);
  }

  importarBS() {
    if (typeof jQuery === 'undefined') {
      var jqueryScript = document.createElement('script');
      jqueryScript.src = 'https://code.jquery.com/jquery-3.5.1.slim.min.js';
      jqueryScript.integrity = 'sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj';
      jqueryScript.crossOrigin = 'anonymous';
      document.head.appendChild(jqueryScript);
    }
  }
  async refresh() {
    const termo = $(`${this.search_barSelector}`).val();

    try {
      // Aguarde a conclusão da busca de dados
      await this.buscarDados(this.url, { 'pesquisa': termo });

      // Atualize a tabela
      this.tabela();
    } catch (error) {
      console.error('Erro ao atualizar a tabela:', error);
      // Trate o erro, se necessário
    }
  }

}