import { useState } from 'react';
import { Table, Button, Modal, InputNumber, message } from 'antd';
import { EditOutlined, ExportOutlined } from '@ant-design/icons';
import { useStore } from '../store';

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; quantity: number } | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const { inventory, updateInventoryQuantity, removeFromInventory } = useStore();

  const handleEdit = (record: any) => {
    setSelectedItem({ id: record.id, quantity: record.quantity });
    setQuantity(record.quantity);
    setIsModalOpen(true);
  };

  const handleUpdateQuantity = () => {
    if (selectedItem && quantity >= 0) {
      updateInventoryQuantity(selectedItem.id, quantity);
      setIsModalOpen(false);
      message.success('库存数量已更新');
    }
  };

  const handleRemove = (record: any) => {
    Modal.confirm({
      title: '出库确认',
      content: (
        <div>
          <p>请输入出库数量：</p>
          <InputNumber
            min={1}
            max={record.quantity}
            defaultValue={1}
            onChange={(value) => setQuantity(value || 0)}
          />
        </div>
      ),
      onOk: () => {
        if (quantity > 0 && quantity <= record.quantity) {
          removeFromInventory(record.id, quantity);
          message.success('出库成功');
        }
      },
    });
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '20%',
    },
    {
      title: '操作',
      key: 'action',
      width: '50%',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ whiteSpace: 'nowrap' }}
          >
            编辑
          </Button>
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: '删除库存项',
                content: '确定要删除这个库存记录吗？',
                onOk: () => {
                  useStore.getState().deleteInventoryItem(record.id);
                  message.success('库存项删除成功');
                },
              });
            }}
            style={{ whiteSpace: 'nowrap' }}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={inventory}
        rowKey="id"
        pagination={{
          pageSize: 10,
          position: ['bottomLeft'],
          showTotal: (total) => `共 ${total} 条记录`,
          simple: true
        }}
      />

      <Modal
        title="编辑库存数量"
        open={isModalOpen}
        onOk={handleUpdateQuantity}
        onCancel={() => setIsModalOpen(false)}
      >
        <InputNumber
          min={0}
          value={quantity}
          onChange={(value) => setQuantity(value || 0)}
          style={{ width: '100%' }}
        />
      </Modal>
    </div>
  );
};

export default Inventory;