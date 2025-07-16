/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Agent } from './presets/agents';

interface User {
  name: string;
  info: string;
}

export const createSystemInstructions = (agent: Agent, user: User): string => {
  let userContext = '';
  if (user.name || user.info) {
    userContext =
      'The user I am speaking to has provided this information about themselves:';
    if (user.name) {
      userContext += ` Their name is ${user.name}.`;
    }
    if (user.info) {
      userContext += ` Here is some more information about them: ${user.info}.`;
    }
  }

  return `
You are ${agent.name}.
${agent.personality}
${userContext}
`;
};

export const createProductParserPrompt = (input: string): string => {
  return `
    Você é um assistente de almoxarifado especialista em organização. Sua tarefa é extrair informações de um texto e formatá-las em um objeto JSON.

    O texto fornecido é: "${input}"

    Analise o texto e extraia os seguintes campos:
    - name: O nome principal do produto (ex: "Camiseta", "Parafuso Sextavado").
    - description: Detalhes adicionais como cor, tamanho, material, marca, etc. (ex: "Azul, algodão, tamanho G", "Aço inox 3/4 polegadas").
    - quantity: O número de unidades. Se não for especificado, use 0.
    - cost: O custo unitário do produto. Se não for especificado, use 0.
    - unitOfMeasure: A unidade de medida do produto (ex: "un", "kg", "L", "m", "caixa"). Se não for especificado, use "un".
    - minStock: O nível mínimo de estoque desejado. Se não for especificado, use 0.
    - maxStock: O nível máximo de estoque desejado. Se não for especificado, use 0.
    - location: O local de armazenamento (ex: "Prateleira A-5"). Se não for especificado, deixe em branco.
    - supplier: O nome do fornecedor do produto. Se não for especificado, deixe em branco.
    - category: A categoria ou grupo do produto (ex: "Vestuário", "Ferramentas"). Se não for especificado, deixe em branco.
    - id: Um SKU (Stock Keeping Unit) sugerido para o produto. Crie um SKU conciso e único combinando o nome e as características principais, em maiúsculas (ex: "CAM-AZ-G", "PAR-SXT-INOX-34").

    Retorne apenas o objeto JSON, sem nenhum texto ou formatação adicional.
  `;
};

export const createOrderParserPrompt = (): string => {
  return `Você é um assistente de entrada de dados ultra-eficiente para um sistema de almoxarifado. Sua tarefa é analisar a imagem de um pedido de compra e extrair informações detalhadas, formatando-as em um objeto JSON. Além de extrair, você deve enriquecer os dados com informações plausíveis quando não estiverem explicitamente na imagem.

Siga estritamente o schema JSON definido.

**Dados a Extrair:**
- **orderNumber**: O número do pedido de compra.
- **issueDate**: A data de emissão do pedido (formato AAAA-MM-DD).
- **supplierName**: O nome ou razão social do fornecedor.
- **supplierTaxId**: O CNPJ do fornecedor.
- **items**: Uma lista de todos os itens do pedido.
    - **supplierCode**: O código do item conforme o fornecedor. Se não houver, deixe em branco.
    - **description**: A descrição completa do item.
    - **quantity**: A quantidade do item.
    - **unitPrice**: O preço por unidade do item.
    - **totalPrice**: O preço total para a linha do item (quantidade * preço unitário).
- **totalAmount**: O valor total do pedido.

**Dados a Enriquecer (Sugira valores se não estiverem presentes):**
- **costCenter**: Sugira um centro de custo (ex: "Manutenção", "Produção", "Administrativo").
- **paymentTerms**: Sugira uma condição de pagamento (ex: "30 dias", "28/42 ddl", "Boleto 15 dias").
- **deliveryDate**: Estime uma data de entrega (formato AAAA-MM-DD), geralmente alguns dias após a data de emissão.
- **status**: Defina o status inicial como "Aguardando Entrega".
- **requester**: Sugira um nome de solicitante (ex: "Almoxarifado", "Gerente de Compras").

Retorne **apenas** o objeto JSON, sem nenhum texto, explicação ou formatação markdown (como \`\`\`json).`;
};
