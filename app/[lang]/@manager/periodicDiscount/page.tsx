/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Textarea,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableColumn,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
} from "@heroui/react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";

type DiscountType = "PERCENT" | "AMOUNT";
type Frequency = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

interface Discount {
  id: string;
  title: string;
  description?: string;
  type: DiscountType;
  value: number;
  currency?: string;
  startDate: string;
  endDate?: string;
  frequency: Frequency;
  daysOfWeek?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PeriodicDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "PERCENT" as DiscountType,
    value: 0,
    currency: "ETB",
    startDate: new Date(),
    endDate: undefined as Date | undefined,
    frequency: "NONE" as Frequency,
    daysOfWeek: "",
    isActive: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await fetch("/api/periodic-discounts");
      const data = await response.json();
      setDiscounts(data);
    } catch (error) {
      console.error("Error fetching discounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isActive: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingId
      ? `/api/periodic-discounts/${editingId}`
      : "/api/periodic-discounts";

    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate?.toISOString(),
        }),
      });

      if (response.ok) {
        await fetchDiscounts();
        handleCloseDialog();
      }
    } catch (error) {
      console.error("Error saving discount:", error);
    }
  };

  const handleEdit = (discount: Discount) => {
    setEditingId(discount.id);
    setFormData({
      title: discount.title,
      description: discount.description || "",
      type: discount.type,
      value: discount.value,
      currency: discount.currency || "ETB",
      startDate: new Date(discount.startDate),
      endDate: discount.endDate ? new Date(discount.endDate) : undefined,
      frequency: discount.frequency,
      daysOfWeek: discount.daysOfWeek || "",
      isActive: discount.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this discount?")) {
      try {
        const response = await fetch(`/api/periodic-discounts/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await fetchDiscounts();
        }
      } catch (error) {
        console.error("Error deleting discount:", error);
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      type: "PERCENT",
      value: 0,
      currency: "ETB",
      startDate: new Date(),
      endDate: undefined,
      frequency: "NONE",
      daysOfWeek: "",
      isActive: true,
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Periodic Discounts</h1>
          <p className="text-muted-foreground">
            Manage periodic discounts for your courses
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Discount
        </Button>
      </div>

      <Card>
        <CardBody className="p-6">
          <Table>
            <TableHeader>
              <TableColumn>Title</TableColumn>
              <TableColumn>Type</TableColumn>
              <TableColumn>Value</TableColumn>
              <TableColumn>Start Date</TableColumn>
              <TableColumn>End Date</TableColumn>
              <TableColumn>Frequency</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {discounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell className="font-medium">
                    {discount.title}
                  </TableCell>
                  <TableCell>{discount.type}</TableCell>
                  <TableCell>
                    {discount.type === "PERCENT"
                      ? `${discount.value}%`
                      : `${discount.currency} ${discount.value}`}
                  </TableCell>
                  <TableCell>
                    {format(new Date(discount.startDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {discount.endDate
                      ? format(new Date(discount.endDate), "MMM dd, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell>{discount.frequency}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        discount.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {discount.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => handleEdit(discount)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="flat"
                        color="danger"
                        size="sm"
                        onClick={() => handleDelete(discount.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {discounts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No discounts found. Create your first discount to get started.
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Dialog */}
      <Modal isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} size="lg">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">
              {editingId ? "Edit Discount" : "Add New Discount"}
            </h3>
          </ModalHeader>
          <ModalBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type"
                  selectedKeys={[formData.type]}
                  onSelectionChange={(keys) =>
                    handleSelectChange("type", Array.from(keys)[0] as string)
                  }
                >
                  <SelectItem key="PERCENT">Percentage</SelectItem>
                  <SelectItem key="AMOUNT">Fixed Amount</SelectItem>
                </Select>
                <Input
                  label="Value"
                  name="value"
                  type="number"
                  value={formData.value.toString()}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Switch
                isSelected={formData.isActive}
                onValueChange={handleSwitchChange}
              >
                Active
              </Switch>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={() => handleSubmit(new Event("submit") as any)}
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
