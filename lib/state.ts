/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Agent, Charlotte, Paul, Penny, Shane } from './presets/agents';

// --- Auth Store ---
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string; // Should be hashed in a real app
  role: UserRole;
  isBlocked?: boolean;
}

export type UserData = Omit<User, 'id' | 'isBlocked'>;

interface AuthState {
  users: User[];
  currentUser: User | null;
  addUser: (userData: UserData) => boolean;
  login: (
    username: string,
    password: string
  ) => 'success' | 'invalid_credentials' | 'user_blocked';
  logout: () => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  toggleUserBlock: (userId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [
        {
          id: 'default-admin',
          username: 'admin',
          password: 'admin',
          role: 'admin',
          isBlocked: false,
        },
      ],
      currentUser: null,
      addUser: userData => {
        const { users } = get();
        if (users.some(u => u.username === userData.username)) {
          return false; // Username already exists
        }
        const newUser: User = {
          ...userData,
          id: new Date().toISOString(),
          isBlocked: false,
        };
        set({ users: [...users, newUser] });
        return true;
      },
      login: (username, password) => {
        const { users } = get();
        const user = users.find(u => u.username === username);

        if (!user || user.password !== password) {
          return 'invalid_credentials';
        }

        if (user.isBlocked) {
          return 'user_blocked';
        }

        const { password: _, ...userToStore } = user;
        set({ currentUser: userToStore });
        return 'success';
      },
      logout: () => {
        set({ currentUser: null });
      },
      updateUserRole: (userId, role) => {
        set(state => ({
          users: state.users.map(user =>
            user.id === userId ? { ...user, role } : user
          ),
        }));
      },
      toggleUserBlock: userId => {
        set(state => ({
          users: state.users.map(user =>
            user.id === userId ? { ...user, isBlocked: !user.isBlocked } : user
          ),
        }));
      },
    }),
    {
      name: 'warehouse-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// --- Inventory Store ---

export interface HistoryEntry {
  date: string;
  type: 'criação' | 'entrada' | 'ajuste' | 'movimentação' | 'saída' | 'estorno';
  description: string;
  quantityAffected?: number;
  responsibleUser?: string;
}

export interface ReversalDetail {
  date: string;
  quantity: number;
  username: string;
}

export interface CheckoutHistoryEntry {
  sequenceId: number;
  id: string;
  date: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  location: string;
  withdrawnBy: string; // The person who took the item
  systemUser: string; // The person who registered the checkout
  status?: 'active' | 'reversed' | 'partially_reversed';
  reversedQuantity?: number;
  reversalHistory?: ReversalDetail[];
}

export interface Product {
  id: string; // SKU, should be unique
  name: string;
  description: string;
  quantity: number;
  location: string;
  cost?: number;
  minStock?: number;
  maxStock?: number;
  supplier?: string;
  category?: string;
  unitOfMeasure?: string;
  history: HistoryEntry[];
}

// Data for creating or updating a product, quantity is initial for new products.
export type ProductData = Omit<Product, 'history'>;

interface InventoryState {
  products: Product[];
  checkoutHistory: CheckoutHistoryEntry[];
  addProduct: (productData: ProductData, username: string) => void;
  updateProduct: (id: string, updates: Partial<ProductData>) => void;
  addStock: (
    id: string,
    quantity: number,
    type: 'entrada' | 'ajuste',
    username: string
  ) => void;
  moveProduct: (id: string, newLocation: string, username: string) => void;
  checkoutStock: (
    id: string,
    quantity: number,
    withdrawnBy: string,
    systemUser: string
  ) => void;
  reverseCheckout: (
    sequenceId: number,
    quantityToReverse: number,
    reversingUsername: string
  ) => { success: boolean; message: string };
  getProductById: (id: string) => Product | undefined;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      products: [],
      checkoutHistory: [],
      addProduct: (productData, username) => {
        const newProduct: Product = {
          ...productData,
          history: [
            {
              date: new Date().toISOString(),
              type: 'criação',
              description: `Estoque inicial: ${productData.quantity} ${
                productData.unitOfMeasure || 'un'
              }(s) em '${productData.location}', criado por ${username}.`,
              quantityAffected: productData.quantity,
              responsibleUser: username,
            },
          ],
        };
        set(state => ({
          products: [...state.products, newProduct].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
        }));
      },
      updateProduct: (id, updates) => {
        set(state => ({
          products: state.products
            .map(p => (p.id === id ? { ...p, ...updates } : p))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }));
      },
      addStock: (id, quantity, type = 'entrada', username) => {
        set(state => ({
          products: state.products.map(p =>
            p.id === id
              ? {
                  ...p,
                  quantity: p.quantity + quantity,
                  history: [
                    ...p.history,
                    {
                      date: new Date().toISOString(),
                      type: type,
                      description: `${
                        type === 'entrada' ? 'Entrada de' : 'Ajuste de'
                      } ${quantity} ${
                        p.unitOfMeasure || 'un'
                      }(s) por ${username}. Novo total: ${
                        p.quantity + quantity
                      }.`,
                      quantityAffected: quantity,
                      responsibleUser: username,
                    },
                  ],
                }
              : p
          ),
        }));
      },
      moveProduct: (id, newLocation, username) => {
        set(state => ({
          products: state.products.map(p => {
            if (p.id === id) {
              const oldLocation = p.location;
              return {
                ...p,
                location: newLocation,
                history: [
                  ...p.history,
                  {
                    date: new Date().toISOString(),
                    type: 'movimentação',
                    description: `Movido de '${
                      oldLocation || 'N/A'
                    }' para '${newLocation}' por ${username}.`,
                    responsibleUser: username,
                    quantityAffected: 0,
                  },
                ],
              };
            }
            return p;
          }),
        }));
      },
      checkoutStock: (id, quantity, withdrawnBy, systemUser) => {
        const product = get().getProductById(id);
        if (!product) return;

        const { checkoutHistory } = get();
        const maxSequenceId = checkoutHistory.reduce(
          (max, entry) => Math.max(max, entry.sequenceId || 0),
          0
        );
        const newSequenceId = maxSequenceId + 1;

        const newCheckoutEntry: CheckoutHistoryEntry = {
          sequenceId: newSequenceId,
          id: `${new Date().toISOString()}-${product.id}`,
          date: new Date().toISOString(),
          productId: product.id,
          productName: product.name,
          productSku: product.id,
          quantity,
          location: product.location,
          withdrawnBy,
          systemUser,
          status: 'active',
          reversedQuantity: 0,
        };

        set(state => ({
          checkoutHistory: [newCheckoutEntry, ...state.checkoutHistory],
          products: state.products.map(p => {
            if (p.id === id) {
              const newQuantity = p.quantity - quantity;
              return {
                ...p,
                quantity: newQuantity,
                history: [
                  ...p.history,
                  {
                    date: new Date().toISOString(),
                    type: 'saída',
                    description: `Saída de ${quantity} ${
                      p.unitOfMeasure || 'un'
                    }(s) retirado por "${withdrawnBy}", registrada por ${systemUser}. Novo total: ${newQuantity}.`,
                    quantityAffected: quantity,
                    responsibleUser: systemUser,
                  },
                ],
              };
            }
            return p;
          }),
        }));
      },
      reverseCheckout: (sequenceId, quantityToReverse, reversingUsername) => {
        const { products, checkoutHistory } = get();
        const entryToReverse = checkoutHistory.find(
          e => e.sequenceId === sequenceId
        );

        if (!entryToReverse) {
          return {
            success: false,
            message: 'Registro de saída não encontrado.',
          };
        }

        const currentReversedQty = entryToReverse.reversedQuantity || 0;
        const maxReversibleQty = entryToReverse.quantity - currentReversedQty;

        if (maxReversibleQty <= 0) {
          return {
            success: false,
            message: 'Esta saída já foi totalmente estornada.',
          };
        }

        if (!Number.isInteger(quantityToReverse) || quantityToReverse <= 0) {
          return {
            success: false,
            message:
              'A quantidade para estorno deve ser um número inteiro positivo.',
          };
        }

        if (quantityToReverse > maxReversibleQty) {
          return {
            success: false,
            message: `A quantidade máxima para estorno é ${maxReversibleQty}.`,
          };
        }

        const product = products.find(p => p.id === entryToReverse.productId);
        if (!product) {
          return {
            success: false,
            message: `Produto com SKU ${entryToReverse.productId} não foi encontrado.`,
          };
        }

        const newReversalDetail: ReversalDetail = {
          date: new Date().toISOString(),
          quantity: quantityToReverse,
          username: reversingUsername,
        };

        set(state => {
          const newReversedTotal = currentReversedQty + quantityToReverse;
          const newStatus =
            newReversedTotal >= entryToReverse.quantity
              ? 'reversed'
              : 'partially_reversed';

          return {
            products: state.products.map(p =>
              p.id === entryToReverse.productId
                ? {
                    ...p,
                    quantity: p.quantity + quantityToReverse,
                    history: [
                      ...p.history,
                      {
                        date: new Date().toISOString(),
                        type: 'estorno',
                        description: `Estorno de ${quantityToReverse} ${
                          p.unitOfMeasure || 'un'
                        }(s) da saída #${String(sequenceId).padStart(
                          6,
                          '0'
                        )} por ${reversingUsername}. Novo total: ${
                          p.quantity + quantityToReverse
                        }.`,
                        quantityAffected: quantityToReverse,
                        responsibleUser: reversingUsername,
                      },
                    ],
                  }
                : p
            ),
            checkoutHistory: state.checkoutHistory.map(entry =>
              entry.sequenceId === sequenceId
                ? {
                    ...entry,
                    status: newStatus,
                    reversedQuantity: newReversedTotal,
                    reversalHistory: [
                      ...(entry.reversalHistory || []),
                      newReversalDetail,
                    ],
                  }
                : entry
            ),
          };
        });

        return { success: true, message: 'Estorno realizado com sucesso!' };
      },
      getProductById: id => {
        return get().products.find(p => p.id === id);
      },
    }),
    {
      name: 'warehouse-inventory-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// --- Partner (Client/Supplier) Store ---
export interface Partner {
  id: string;
  type: 'cliente' | 'fornecedor' | 'ambos';
  name: string;
  taxId?: string; // CNPJ/CPF
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type PartnerData = Omit<Partner, 'id'>;

interface PartnerState {
  partners: Partner[];
  addPartner: (partnerData: PartnerData) => void;
  updatePartner: (id: string, updates: Partial<PartnerData>) => void;
  deletePartner: (id: string) => void;
  getPartnerById: (id: string) => Partner | undefined;
}

export const usePartnerStore = create<PartnerState>()(
  persist(
    (set, get) => ({
      partners: [],
      addPartner: partnerData => {
        const newPartner: Partner = {
          ...partnerData,
          id: new Date().toISOString(),
        };
        set(state => ({
          partners: [...state.partners, newPartner].sort((a, b) =>
            a.name.localeCompare(b.name)
          ),
        }));
      },
      updatePartner: (id, updates) => {
        set(state => ({
          partners: state.partners
            .map(p => (p.id === id ? { ...p, ...updates } : p))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }));
      },
      deletePartner: id => {
        set(state => ({
          partners: state.partners.filter(p => p.id !== id),
        }));
      },
      getPartnerById: id => {
        return get().partners.find(p => p.id === id);
      },
    }),
    {
      name: 'warehouse-partner-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// --- Order (Purchase Order) Store ---
export interface OrderItem {
  supplierCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string; // Unique ID for the order
  orderNumber: string;
  issueDate: string;
  supplierName: string;
  supplierTaxId: string; // CNPJ
  items: OrderItem[];
  totalAmount: number;
  // Enriched data
  costCenter: string;
  paymentTerms: string;
  firstDueDate?: string;
  deliveryDate: string;
  status: string;
  requester: string;
  // System data
  importedAt: string;
  importedBy: string; // username
  originalImage?: string; // base64 of the original image
}

export type OrderData = Omit<Order, 'id' | 'importedAt' | 'importedBy'>;

interface OrderState {
  orders: Order[];
  addOrder: (orderData: OrderData, username: string, image?: string) => void;
  getOrderById: (id: string) => Order | undefined;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (orderData, username, image) => {
        const newOrder: Order = {
          ...orderData,
          id: new Date().toISOString(),
          importedAt: new Date().toISOString(),
          importedBy: username,
          originalImage: image,
        };
        set(state => ({
          orders: [newOrder, ...state.orders].sort(
            (a, b) =>
              new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
          ),
        }));
      },
      getOrderById: id => {
        return get().orders.find(o => o.id === id);
      },
    }),
    {
      name: 'warehouse-order-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// --- UI Store ---
interface UIState {
  showAgentEdit: boolean;
  setShowAgentEdit: (show: boolean) => void;
  showUserConfig: boolean;
  setShowUserConfig: (show: boolean) => void;
}

export const useUI = create<UIState>()(set => ({
  showAgentEdit: false,
  setShowAgentEdit: show => set({ showAgentEdit: show }),
  showUserConfig: false,
  setShowUserConfig: show => set({ showUserConfig: show }),
}));

// --- User (for AI agent) Store ---
// This is for the AI agent's context, separate from the main app's authentication.
interface AgentUserState {
  name: string;
  info: string;
  setName: (name: string) => void;
  setInfo: (info: string) => void;
}

export const useUser = create<AgentUserState>()(
  persist(
    set => ({
      name: '',
      info: '',
      setName: (name: string) => set({ name }),
      setInfo: (info: string) => set({ info }),
    }),
    {
      name: 'agent-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// --- Agent Store ---
interface AgentState {
  agents: Agent[];
  current: Agent;
  setCurrent: (id: string) => void;
  update: (id: string, updates: Partial<Agent>) => void;
}

export const useAgent = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [Charlotte, Paul, Shane, Penny],
      current: Charlotte,
      setCurrent: (id: string) => {
        const agent = get().agents.find(a => a.id === id);
        if (agent) {
          set({ current: agent });
        }
      },
      update: (id: string, updates: Partial<Agent>) => {
        set(state => ({
          agents: state.agents.map(agent =>
            agent.id === id ? { ...agent, ...updates } : agent
          ),
          current:
            state.current.id === id
              ? { ...state.current, ...updates }
              : state.current,
        }));
      },
    }),
    {
      name: 'agent-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);