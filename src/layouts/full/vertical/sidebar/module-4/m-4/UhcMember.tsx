'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { Card } from 'src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { Trash2, Upload, Search } from 'lucide-react';

interface ImageFile {
  id: string;
  name: string;
  url: string;
  uploadDate: string;
}

interface FolderData {
  [key: string]: ImageFile[];
}

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Documents',
  },
];

const FOLDERS = [
  'Basic Identification',
  'PhilHealth',
  'Company Documents',
  'Medical Documents',
  'Admission Requirements',
];

const UhcMember = () => {
  const [folderData, setFolderData] = useState<FolderData>(
    FOLDERS.reduce((acc, folder) => ({ ...acc, [folder]: [] }), {})
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(FOLDERS[0]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, folder: string) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const newImage: ImageFile = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          url: imageUrl,
          uploadDate: new Date().toLocaleDateString(),
        };

        setFolderData((prev) => ({
          ...prev,
          [folder]: [...prev[folder], newImage],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteImage = (folder: string, imageId: string) => {
    setFolderData((prev) => ({
      ...prev,
      [folder]: prev[folder].filter((img) => img.id !== imageId),
    }));
  };

  const getFilteredFolderData = (folder: string): ImageFile[] => {
    if (!searchQuery) return folderData[folder];
    return folderData[folder].filter((img) =>
      img.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <>
      <BreadcrumbComp title="Health Card Holder" items={BCrumb} />
      
      <div className="flex flex-col gap-6">
        {/* Search Bar */}
        <Card className="p-4">
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Search documents"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button className="flex gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </Card>

        {/* Tabs for Folders */}
        <Tabs value={selectedFolder} onValueChange={setSelectedFolder} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {FOLDERS.map((folder) => (
              <TabsTrigger key={folder} value={folder}>
                {folder}
              </TabsTrigger>
            ))}
          </TabsList>

          {FOLDERS.map((folder) => (
            <TabsContent key={folder} value={folder}>
              <Card className="p-6">
                {/* Upload Section */}
                <div className="mb-6">
                  <label htmlFor={`upload-${folder}`} className="block mb-2 font-medium">
                    Upload Images
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id={`upload-${folder}`}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, folder)}
                      className="flex-1"
                    />
                    <Button className="flex gap-2">
                      <Upload className="w-4 h-4" />
                      Upload
                    </Button>
                  </div>
                </div>

                {/* Images Grid */}
                <div>
                  <h3 className="font-medium mb-4">
                    Documents ({getFilteredFolderData(folder).length})
                  </h3>
                  {getFilteredFolderData(folder).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {getFilteredFolderData(folder).map((image) => (
                        <div
                          key={image.id}
                          className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                        >
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteImage(folder, image.id)}
                              className="flex gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                          <p className="text-xs p-2 text-gray-600 truncate">
                            {image.name}
                          </p>
                          <p className="text-xs px-2 pb-2 text-gray-500">
                            {image.uploadDate}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>No images uploaded yet</p>
                      <p className="text-sm">Upload images to get started</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
};

export default UhcMember;
