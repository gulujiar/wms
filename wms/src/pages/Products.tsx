import { useState } from 'react';
import { Table, Button, Modal, Form, Input, message, InputNumber } from 'antd';
import { PlusOutlined, ImportOutlined } from '@ant-design/icons';
import { useStore } from '../store';

const Products = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stockQuantity, setStockQuantity] = useState<number>(1);
  const [form] = Form.useForm();
  const { products, addProduct, addToInventory } = useStore();

  const columns = [
    {
      title: '图片',
      dataIndex: 'image',
      key: 'image',
      render: (text) => text ? <img src={text} style={{ width: 50, height: 50, objectFit: 'contain' }} /> : null,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            onClick={() => {
              setSelectedProduct(record);
              form.setFieldsValue({
                name: record.name,
                note: record.note,
                image: record.image
              });
              setIsModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="primary"
            icon={<ImportOutlined />}
            onClick={() => {
              setSelectedProduct(record);
              setIsStockModalOpen(true);
            }}
          >
            入库
          </Button>
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: '删除产品',
                content: '确定要删除该产品吗？此操作会同时删除关联的库存记录',
                onOk: () => {
                  useStore.getState().deleteProduct(record.id);
                  message.success('产品删除成功');
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

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      addProduct(values.name, values.note);
      setIsModalOpen(false);
      form.resetFields();
      message.success('产品添加成功');
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  return (
    <div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsModalOpen(true)}
        style={{ marginBottom: 16 }}
      >
        添加产品
      </Button>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        pagination={{
          pageSize: 10,
          position: ['bottomLeft'],
          showTotal: (total) => `共 ${total} 条记录`,
          simple: true
        }}
      />

      <Modal
        title="添加产品"
        open={isModalOpen}
        onOk={handleAdd}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入产品名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="image" label="图片URL">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="入库数量"
        open={isStockModalOpen}
        onOk={() => {
          if (selectedProduct && stockQuantity > 0) {
            addToInventory(selectedProduct.id, stockQuantity);
            message.success(`已添加${stockQuantity}个产品到库存`);
            setIsStockModalOpen(false);
            setStockQuantity(1);
          }
        }}
        onCancel={() => {
          setIsStockModalOpen(false);
          setStockQuantity(1);
        }}
      >
        <div>
          <InputNumber
            min={1}
            value={stockQuantity}
            onChange={(value) => setStockQuantity(value || 1)}
            style={{ width: '200px' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Products;