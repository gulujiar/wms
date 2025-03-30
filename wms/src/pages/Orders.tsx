import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { PlusOutlined, ExportOutlined } from '@ant-design/icons';
import { useStore } from '../store';

const Orders = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { orders, products, addOrder, processOrderShipment } = useStore();
  const [selectedProducts, setSelectedProducts] = useState<{ productId: string; name: string; quantity: number }[]>([]);

  const handleAddProduct = () => {
    const product = form.getFieldValue('product');
    const quantity = form.getFieldValue('quantity');
    if (product && quantity) {
      const selectedProduct = products.find(p => p.id === product);
      if (selectedProduct) {
        setSelectedProducts([
          ...selectedProducts,
          {
            productId: selectedProduct.id,
            name: selectedProduct.name,
            quantity
          }
        ]);
        form.setFieldsValue({ product: undefined, quantity: 1 });
      }
    }
  };

  const handleAdd = async () => {
    try {
      if (selectedProducts.length === 0) {
        message.error('请至少选择一个产品');
        return;
      }
      const values = await form.validateFields(['name', 'address', 'note']);
      addOrder(values.name, values.address, values.note, selectedProducts);
      setIsModalOpen(false);
      form.resetFields();
      setSelectedProducts([]);
      message.success('订单创建成功');
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  const handleShipment = (orderId: string) => {
    Modal.confirm({
      title: '确认出库',
      content: '确定要执行出库操作吗？这将从库存中扣除相应的产品数量。',
      onOk: () => {
        processOrderShipment(orderId);
        message.success('订单出库成功');
      },
    });
  };

  const columns = [
    {
      title: '订单名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: '产品',
      key: 'products',
      render: (_, record) => (
        <div>
          {record.products?.length ? (
            record.products.map((p: any) => (
              <div key={p.productId}>
                <span style={{ fontWeight: 'bold' }}>{p.name}</span>
              </div>
            ))
          ) : (
            <span>-</span>
          )}
        </div>
      ),
    },
    {
      title: '数量',
      key: 'quantities',
      render: (_, record) => (
        <div>
          {record.products?.length ? (
            record.products.map((p: any) => (
              <div key={p.productId}>
                {p.quantity}
              </div>
            ))
          ) : (
            <span>-</span>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={() => handleShipment(record.id)}
          >
            出库
          </Button>
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: '删除订单',
                content: '确定要删除这个订单吗？',
                onOk: () => {
                  useStore.getState().deleteOrder(record.id);
                  message.success('订单删除成功');
                },
              });
            }}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsModalOpen(true)}
        style={{ marginBottom: 16 }}
      >
        创建订单
      </Button>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        pagination={{
          pageSize: 10,
          position: ['bottomLeft'],
          showTotal: (total) => `共 ${total} 条记录`,
          showSizeChanger: false,
          hideOnSinglePage: true
        }}
      />

      <Modal
        title="创建订单"
        open={isModalOpen}
        onOk={handleAdd}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setSelectedProducts([]);
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="订单名"
            rules={[{ required: true, message: '请输入订单名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <h4>添加产品</h4>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Form.Item name="product" style={{ flex: 1, margin: 0 }}>
                <Select placeholder="选择产品">
                  {products.map(product => (
                    <Select.Option key={product.id} value={product.id}>
                      {product.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="quantity" initialValue={1} style={{ margin: 0 }}>
                <InputNumber min={1} />
              </Form.Item>
              <Button type="primary" onClick={handleAddProduct}>添加</Button>
            </div>
            {selectedProducts.map((p, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                {p.name} x {p.quantity}
                <Button
                  type="link"
                  danger
                  onClick={() => setSelectedProducts(selectedProducts.filter((_, i) => i !== index))}
                >
                  删除
                </Button>
              </div>
            ))}
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;