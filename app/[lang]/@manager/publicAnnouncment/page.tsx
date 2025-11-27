'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Button,
  Input,
  Switch,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
  Badge,
  Avatar,
} from '@heroui/react';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Image as ImageIcon } from 'lucide-react';

// ... rest of your imports and type definitions ...

export default function PublicAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    message: '',
    photo: '',
    startDate: null,
    endDate: null,
    isActive: true,
  });

  // ... rest of your component logic ...

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Public Announcements</h1>
          <p className="text-gray-600">Manage announcements that will be displayed to users</p>
        </div>
        <Button 
          onClick={() => setIsOpen(true)}
          startContent={<Plus className="h-4 w-4" />}
        >
          Add Announcement
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Message</TableHead>
                    <TableHead className="hidden md:table-cell">Image</TableHead>
                    <TableHead className="hidden md:table-cell">Start Date</TableHead>
                    <TableHead className="hidden md:table-cell">End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.length > 0 ? (
                    announcements.map((announcement) => {
                      const isActive = announcement.isActive && 
                        (!announcement.startDate || new Date(announcement.startDate) <= new Date()) &&
                        (!announcement.endDate || new Date(announcement.endDate) >= new Date());
                      
                      return (
                        <TableRow key={announcement.id} className={!isActive ? 'opacity-70' : ''}>
                          <TableCell className="font-medium max-w-[300px]">
                            <div className="line-clamp-2">
                              {announcement.message}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {announcement.photo ? (
                              <a 
                                href={announcement.photo} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center text-sm"
                              >
                                <ImageIcon className="h-4 w-4 mr-1" /> View
                              </a>
                            ) : (
                              <span className="text-gray-500 text-sm">No image</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(announcement.startDate)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(announcement.endDate)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              color={!announcement.isActive ? 'default' : isActive ? 'success' : 'warning'}
                              onClick={() => handleStatusToggle(announcement.id, announcement.isActive)}
                              className="cursor-pointer"
                            >
                              {!announcement.isActive ? 'Inactive' : isActive ? 'Active' : 'Scheduled'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="light"
                              size="sm"
                              isIconOnly
                              onClick={() => handleEdit(announcement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="light"
                              color="danger"
                              size="sm"
                              isIconOnly
                              onClick={() => handleDelete(announcement.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <BellIcon className="h-12 w-12 text-gray-300" />
                          <p className="text-lg font-medium">No announcements yet</p>
                          <p>Get started by creating your first announcement</p>
                          <Button 
                            onClick={() => setIsOpen(true)}
                            startContent={<Plus className="h-4 w-4" />}
                          >
                            Create Announcement
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => {
        resetForm();
        setIsOpen(false);
      }} size="lg">
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-semibold">
              {formData.id ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>
          </ModalHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <Textarea
              label="Message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter announcement message"
              required
              minRows={4}
            />

            <Input
              label="Image URL (Optional)"
              name="photo"
              value={formData.photo}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
              endContent={
                formData.photo && (
                  <a 
                    href={formData.photo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm flex items-center"
                  >
                    <ImageIcon className="h-4 w-4 mr-1" /> Preview
                  </a>
                )
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="datetime-local"
                value={formData.startDate ? format(formData.startDate, "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setFormData(prev => ({ ...prev, startDate: date }));
                }}
              />
              
              <Input
                label="End Date (Optional)"
                type="datetime-local"
                value={formData.endDate ? format(formData.endDate, "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setFormData(prev => ({ ...prev, endDate: date }));
                }}
                min={formData.startDate ? format(formData.startDate, "yyyy-MM-dd'T'HH:mm") : undefined}
              />
            </div>

            <Switch
              isSelected={formData.isActive}
              onValueChange={(isActive) => setFormData(prev => ({ ...prev, isActive }))}
            >
              Active
            </Switch>

            <ModalFooter>
              <Button 
                variant="light" 
                onPress={() => {
                  resetForm();
                  setIsOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                color="primary" 
                type="submit"
                isLoading={isSubmitting}
              >
                {formData.id ? 'Update' : 'Create'} Announcement
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}