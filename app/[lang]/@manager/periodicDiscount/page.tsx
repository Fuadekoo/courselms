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
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from "@heroui/react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Calendar as CalendarIcon } from "lucide-react";

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
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
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
                  <TableCell className="text-right">
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
              {discounts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No discounts found. Create your first discount to get
                    started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Modal open={isDialogOpen} onOpenChange={setIsDialogOpen} size="lg">
        <ModalContent>
          <ModalHeader>
            <CardTitle>
              {editingId ? "Edit Discount" : "Add New Discount"}
            </CardTitle>
            <CardDescription>
              {editingId
                ? "Update the discount details below."
                : "Fill in the form to create a new discount."}
            </CardDescription>
          </ModalHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="E.g., Summer Sale"
                required
              />
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => handleSelectChange("type", e.target.value)}
                required
              >
                <SelectItem value="PERCENT">Percentage</SelectItem>
                <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
              </Select>
              <Input
                label={formData.type === "PERCENT" ? "Percentage" : "Amount"}
                type="number"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                placeholder={formData.type === "PERCENT" ? "10" : "100"}
                min="0"
                step={formData.type === "PERCENT" ? "0.01" : "1"}
                required
              />
              {formData.type === "AMOUNT" && (
                <Select
                  label="Currency"
                  value={formData.currency}
                  onChange={(e) =>
                    handleSelectChange("currency", e.target.value)
                  }
                >
                  <SelectItem value="ETB">ETB</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </Select>
              )}
              <Input
                label="Start Date"
                type="date"
                name="startDate"
                value={formData.startDate.toISOString().slice(0, 10)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startDate: new Date(e.target.value),
                  })
                }
                required
              />
              <Input
                label="End Date"
                type="date"
                name="endDate"
                value={
                  formData.endDate
                    ? formData.endDate.toISOString().slice(0, 10)
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endDate: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  })
                }
              />
              <Select
                label="Frequency"
                value={formData.frequency}
                onChange={(e) =>
                  handleSelectChange("frequency", e.target.value)
                }
                required
              >
                <SelectItem value="NONE">One Time</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </Select>
              {formData.frequency === "WEEKLY" && (
                <Input
                  label="Days of Week"
                  name="daysOfWeek"
                  value={formData.daysOfWeek}
                  onChange={handleInputChange}
                  placeholder="1,3,5 (Mon, Wed, Fri)"
                />
              )}
              <Switch
                label="Active"
                checked={formData.isActive}
                onChange={handleSwitchChange}
              />
              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter a description for this discount..."
                rows={3}
              />
            </div>
            <ModalFooter className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="light" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" color="primary">
                {editingId ? "Update Discount" : "Create Discount"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
