/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import StockEntryForm from './components/StockEntryForm';
import MoveProductForm from './components/MoveProductForm';
import LoginScreen from './components/LoginScreen';
import Navigation from './components/Navigation';
import StockCheckout from './components/StockCheckout';
import StockCheckoutForm from './components/StockCheckoutForm';
import UserManagement from './components/UserManagement';
import UserForm from './components/UserForm';
import Reports from './components/Reports';
import ReverseCheckoutForm from './components/ReverseCheckoutForm';
import MinimumStockList from './components/MinimumStockList';
import PrintLabelModal from './components/PrintLabelModal';
import PartnerForm from './components/PartnerForm';
import OrderReviewModal from './components/OrderReviewModal';
import OrderDetailModal from './components/OrderDetailModal';
import {
  useInventoryStore,
  useAuthStore,
  useOrderStore,
  Product,
  Partner,
  Order,
  OrderData,
} from './lib/state';

export type ModalState =
  | { type: 'NONE' }
  | { type: 'ADD_PRODUCT' }
  | { type: 'EDIT_PRODUCT'; product: Product }
  | { type: 'ADD_STOCK'; product: Product }
  | { type: 'MOVE_PRODUCT'; product: Product }
  | { type: 'CHECKOUT_STOCK'; product: Product }
  | { type: 'ADD_USER' }
  | { type: 'REVERSE_CHECKOUT' }
  | { type: 'ADD_PARTNER' }
  | { type: 'EDIT_PARTNER'; partner: Partner }
  | { type: 'ORDER_REVIEW'; orderData: OrderData; imageBase64: string }
  | { type: 'ORDER_DETAIL'; order: Order };

export type ViewState = 'stock' | 'checkout' | 'users' | 'reports';

function App() {
  const { currentUser } = useAuthStore();
  const [modalState, setModalState] = useState<ModalState>({ type: 'NONE' });
  const [view, setView] = useState<ViewState>('stock');
  const [printModalProduct, setPrintModalProduct] = useState<Product | null>(
    null
  );
  const { addProduct, updateProduct } = useInventoryStore();
  const { addOrder } = useOrderStore();

  const handleCloseModal = () => setModalState({ type: 'NONE' });

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="App">
      <Header />
      <main>
        <Navigation view={view} setView={setView} />
        {view === 'stock' && (
          <ProductList
            setModalState={setModalState}
            setPrintModalProduct={setPrintModalProduct}
          />
        )}
        {view === 'checkout' && <StockCheckout setModalState={setModalState} />}
        {view === 'users' && <UserManagement setModalState={setModalState} />}
        {view === 'reports' && (
          <Reports setView={setView} setModalState={setModalState} />
        )}
      </main>

      {modalState.type === 'ADD_PRODUCT' && (
        <ProductForm
          onClose={handleCloseModal}
          onSave={productData => {
            addProduct(productData, currentUser.username);
            handleCloseModal();
          }}
          title="Adicionar Novo Produto"
        />
      )}

      {modalState.type === 'EDIT_PRODUCT' && (
        <ProductForm
          onClose={handleCloseModal}
          onSave={productData => {
            updateProduct(modalState.product.id, productData);
            handleCloseModal();
          }}
          title="Editar Produto"
          productToEdit={modalState.product}
        />
      )}

      {modalState.type === 'ADD_STOCK' && (
        <StockEntryForm
          onClose={handleCloseModal}
          product={modalState.product}
        />
      )}

      {modalState.type === 'MOVE_PRODUCT' && (
        <MoveProductForm
          onClose={handleCloseModal}
          product={modalState.product}
        />
      )}

      {modalState.type === 'CHECKOUT_STOCK' && (
        <StockCheckoutForm
          onClose={handleCloseModal}
          product={modalState.product}
        />
      )}

      {modalState.type === 'REVERSE_CHECKOUT' && (
        <ReverseCheckoutForm onClose={handleCloseModal} />
      )}

      {modalState.type === 'ADD_USER' && (
        <UserForm onClose={handleCloseModal} />
      )}

      {modalState.type === 'ADD_PARTNER' && (
        <PartnerForm onClose={handleCloseModal} />
      )}

      {modalState.type === 'EDIT_PARTNER' && (
        <PartnerForm
          onClose={handleCloseModal}
          partnerToEdit={modalState.partner}
        />
      )}

      {modalState.type === 'ORDER_REVIEW' && (
        <OrderReviewModal
          onClose={handleCloseModal}
          orderData={modalState.orderData}
          imageBase64={modalState.imageBase64}
          onSave={(editedOrderData, image) => {
            if (currentUser) {
              addOrder(editedOrderData, currentUser.username, image);
            }
            handleCloseModal();
          }}
        />
      )}

      {modalState.type === 'ORDER_DETAIL' && (
        <OrderDetailModal
          order={modalState.order}
          onClose={handleCloseModal}
        />
      )}

      {printModalProduct && (
        <PrintLabelModal
          product={printModalProduct}
          onClose={() => setPrintModalProduct(null)}
        />
      )}
    </div>
  );
}

export default App;
