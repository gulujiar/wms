import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Product {
  id: string;
  name: string;
  note: string;
}

interface InventoryItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
}

interface OrderProduct {
  productId: string;
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  name: string;
  address: string;
  note: string;
  products: OrderProduct[];
}

interface StoreState {
  products: Product[];
  inventory: InventoryItem[];
  orders: Order[];
  addProduct: (name: string, note: string) => void;
  addToInventory: (productId: string, quantity: number) => void;
  updateInventoryQuantity: (id: string, quantity: number) => void;
  removeFromInventory: (id: string, quantity: number) => void;
  deleteProduct: (id: string) => void;
  deleteInventoryItem: (id: string) => void;
  deleteOrder: (id: string) => void;
  addOrder: (name: string, address: string, note: string, products: OrderProduct[]) => void;
  processOrderShipment: (orderId: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      products: [],
      inventory: [],
      fetchProducts: async () => {
        try {
          const response = await fetch('http://localhost:3001/api/products', { cache: 'no-store' });
          const data = await response.json();
          set({ products: data });
        } catch (error) {
          console.error('获取产品列表失败:', error);
        }
      },
      fetchInventory: async () => {
        try {
          const response = await fetch('http://localhost:3001/api/inventory', { cache: 'no-store' });
          const data = await response.json();
          set({ inventory: data });
        } catch (error) {
          console.error('获取库存失败:', error);
        }
      },
      fetchOrders: async () => {
        try {
          const response = await fetch('http://localhost:3001/api/orders', { cache: 'no-store' });
          const data = await response.json();
          set({ orders: data });
        } catch (error) {
          console.error('获取订单失败:', error);
        }
      },
      orders: [],

      addProduct: async (name, note) => {
        try {
          const response = await fetch('http://localhost:3001/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, note })
          });
          await response.json();
          useStore.getState().fetchProducts();
        } catch (error) {
          console.error('添加产品失败:', error);
        }
      },

      addToInventory: async (productId, quantity) => {
        try {
          const response = await fetch('http://localhost:3001/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity })
          });
          await response.json();
          useStore.getState().fetchInventory();
        } catch (error) {
          console.error('添加库存失败:', error);
        }
      },

      updateInventoryQuantity: async (id, quantity) => {
        try {
          const response = await fetch(`http://localhost:3001/api/inventory/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity })
          });
          if (!response.ok) throw new Error('更新库存失败');
          await response.json();
          useStore.getState().fetchInventory();
        } catch (error) {
          console.error('更新库存数量失败:', error);
          throw error;
        }
      },

      removeFromInventory: async (id, quantity) => {
        try {
          const response = await fetch(`http://localhost:3001/api/inventory/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity })
          });
          if (!response.ok) throw new Error('出库失败');
          await response.json();
          useStore.getState().fetchInventory();
        } catch (error) {
          console.error('出库失败:', error);
          throw error;
        }
      },

      addOrder: async (name, address, note, products) => {
        try {
          const response = await fetch('http://localhost:3001/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, address, note, products })
          });
          await response.json();
          useStore.getState().fetchOrders();
        } catch (error) {
          console.error('添加订单失败:', error);
        }
      },

      processOrderShipment: async (orderId) => {
        try {
          const order = useStore.getState().orders.find(o => o.id === orderId);
          if (!order) throw new Error('订单不存在');

          const updates = order.products.map(p => ({
            productId: p.productId,
            quantity: -p.quantity
          }));

          const response = await fetch('http://localhost:3001/api/inventory/bulk', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '库存更新失败');
          }

          await useStore.getState().fetchInventory();
        } catch (error) {
          console.error('出库失败:', error);
          throw error;
        }
      },

      deleteProduct: async (id) => {
        try {
          await fetch(`http://localhost:3001/api/products/${id}`, {
            method: 'DELETE'
          });
          useStore.getState().fetchProducts();
          useStore.getState().fetchInventory();
        } catch (error) {
          console.error('删除产品失败:', error);
        }
      },

      deleteInventoryItem: async (id) => {
        try {
          await fetch(`http://localhost:3001/api/inventory/${id}`, {
            method: 'DELETE'
          });
          useStore.getState().fetchInventory();
        } catch (error) {
          console.error('删除库存项失败:', error);
        }
      },

      deleteOrder: async (id) => {
        try {
          await fetch(`http://localhost:3001/api/orders/${id}`, {
            method: 'DELETE'
          });
          useStore.getState().fetchOrders();
        } catch (error) {
          console.error('删除订单失败:', error);
        }
      }
    }),
    {
      name: 'wms-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.fetchProducts();
          state.fetchInventory();
          state.fetchOrders();
        }
      }
    }
  )
);