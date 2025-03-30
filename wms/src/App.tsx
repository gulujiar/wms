import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { ShopOutlined, DatabaseOutlined, OrderedListOutlined } from '@ant-design/icons';
import { useState } from 'react';
import './App.css';

// 页面组件
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';

const { Header, Content, Sider } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: 'products',
      icon: <ShopOutlined />,
      label: <Link to="/products">产品管理</Link>,
    },
    {
      key: 'inventory',
      icon: <DatabaseOutlined />,
      label: <Link to="/inventory">库存管理</Link>,
    },
    {
      key: 'orders',
      icon: <OrderedListOutlined />,
      label: <Link to="/orders">订单管理</Link>,
    },
  ];

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} style={{ position: 'fixed', height: '100vh', left: 0, zIndex: 1 }}>
          <div className="logo" style={{ color: 'white', textAlign: 'center', padding: '16px 0', fontSize: '18px', fontWeight: 'bold', background: 'transparent' }}>
            森夏库存管理系统
          </div>
          <Menu
            theme="dark"
            defaultSelectedKeys={['products']}
            mode="inline"
            items={menuItems}
          />
        </Sider>
        <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
          <Header style={{ padding: 0, background: 'transparent', position: 'sticky', top: 0, zIndex: 1 }} />
          <Content style={{ padding: '0 24px' }}>
            <div style={{ padding: 24, minHeight: 360 }}>
              <Routes>
                <Route path="/products" element={<Products />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/" element={<Products />} />
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;
