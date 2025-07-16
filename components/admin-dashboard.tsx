"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon, Copy, Edit, Trash, QrCode, PlusCircle, Eye, EyeOff } from "lucide-react"
import QRCode from "qrcode.react" // Corrected import to default export

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"

// Define types for your data
interface AccessCode {
  id: string
  code: string
  usage_limit: number
  current_usage: number
  expires_at: string | null
  is_active: boolean
  created_at: string
  purchase_link_id: string | null
  customer_name: string | null
  customer_email: string | null
  transaction_id: string | null
  amount_paid: number | null
  purchase_date: string | null
}

interface PurchaseLink {
  id: string
  slug: string
  price: number
  currency: string
  description: string
  created_at: string
  is_active: boolean
}

export function AdminDashboard() {
  // This is the correctly named and exported component
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("access-codes")
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
  const [purchaseLinks, setPurchaseLinks] = useState<PurchaseLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for new access code creation
  const [newCodeUsageLimit, setNewCodeUsageLimit] = useState(1)
  const [newCodeExpiresAt, setNewCodeExpiresAt] = useState<Date | undefined>(undefined)
  const [newCodeIsActive, setNewCodeIsActive] = useState(true)
  const [newCodePurchaseLinkId, setNewCodePurchaseLinkId] = useState<string | null>(null)

  // State for new purchase link creation
  const [newLinkPrice, setNewLinkPrice] = useState(0)
  const [newLinkCurrency, setNewLinkCurrency] = useState("usd")
  const [newLinkDescription, setNewLinkDescription] = useState("")
  const [newLinkIsActive, setNewLinkIsActive] = useState(true)

  // State for editing access code
  const [editingCode, setEditingCode] = useState<AccessCode | null>(null)
  const [editUsageLimit, setEditUsageLimit] = useState(0)
  const [editExpiresAt, setEditExpiresAt] = useState<Date | undefined>(undefined)
  const [editIsActive, setEditIsActive] = useState(false)

  // State for editing purchase link
  const [editingLink, setEditingLink] = useState<PurchaseLink | null>(null)
  const [editLinkPrice, setEditLinkPrice] = useState(0)
  const [editLinkCurrency, setEditLinkCurrency] = useState("")
  const [editLinkDescription, setEditLinkDescription] = useState("")
  const [editLinkIsActive, setEditLinkIsActive] = useState(false)

  // State for QR code dialog
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [isQrCodeDialogOpen, setIsQrCodeDialogOpen] = useState(false)

  const fetchAccessCodes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/list-codes", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
      })
      if (!res.ok) {
        throw new Error(`Failed to fetch access codes: ${res.statusText}`)
      }
      const data = await res.json()
      setAccessCodes(data.codes)
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchPurchaseLinks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/list-links", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
      })
      if (!res.ok) {
        throw new Error(`Failed to fetch purchase links: ${res.statusText}`)
      }
      const data = await res.json()
      setPurchaseLinks(data.links)
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (activeTab === "access-codes") {
      fetchAccessCodes()
    } else if (activeTab === "purchase-links") {
      fetchPurchaseLinks()
    }
  }, [activeTab, fetchAccessCodes, fetchPurchaseLinks])

  const handleCreateAccessCode = async () => {
    try {
      const res = await fetch("/api/admin/create-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          usage_limit: newCodeUsageLimit,
          expires_at: newCodeExpiresAt ? newCodeExpiresAt.toISOString() : null,
          is_active: newCodeIsActive,
          purchase_link_id: newCodePurchaseLinkId,
        }),
      })
      if (!res.ok) {
        throw new Error(`Failed to create access code: ${res.statusText}`)
      }
      toast({
        title: "Success",
        description: "Access code created successfully!",
      })
      fetchAccessCodes()
      // Reset form
      setNewCodeUsageLimit(1)
      setNewCodeExpiresAt(undefined)
      setNewCodeIsActive(true)
      setNewCodePurchaseLinkId(null)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const handleCreatePurchaseLink = async () => {
    try {
      const res = await fetch("/api/admin/create-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          price: newLinkPrice,
          currency: newLinkCurrency,
          description: newLinkDescription,
          is_active: newLinkIsActive,
        }),
      })
      if (!res.ok) {
        throw new Error(`Failed to create purchase link: ${res.statusText}`)
      }
      toast({
        title: "Success",
        description: "Purchase link created successfully!",
      })
      fetchPurchaseLinks()
      // Reset form
      setNewLinkPrice(0)
      setNewLinkCurrency("usd")
      setNewLinkDescription("")
      setNewLinkIsActive(true)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const handleEditAccessCode = async () => {
    if (!editingCode) return
    try {
      const res = await fetch("/api/admin/update-code", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          id: editingCode.id,
          usage_limit: editUsageLimit,
          expires_at: editExpiresAt ? editExpiresAt.toISOString() : null,
          is_active: editIsActive,
        }),
      })
      if (!res.ok) {
        throw new Error(`Failed to update access code: ${res.statusText}`)
      }
      toast({
        title: "Success",
        description: "Access code updated successfully!",
      })
      fetchAccessCodes()
      setEditingCode(null) // Close dialog
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccessCode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this access code?")) return
    try {
      const res = await fetch("/api/admin/delete-code", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        throw new Error(`Failed to delete access code: ${res.statusText}`)
      }
      toast({
        title: "Success",
        description: "Access code deleted successfully!",
      })
      fetchAccessCodes()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const handleDeletePurchaseLink = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase link?")) return
    try {
      const res = await fetch("/api/admin/delete-link", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        throw new Error(`Failed to delete purchase link: ${res.statusText}`)
      }
      toast({
        title: "Success",
        description: "Purchase link deleted successfully!",
      })
      fetchPurchaseLinks()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const generateQrCode = (slug: string) => {
    const baseUrl = window.location.origin // Get the current origin (e.g., http://localhost:3000 or your Vercel URL)
    const url = `${baseUrl}/buy/${slug}`
    setQrCodeUrl(url)
    setIsQrCodeDialogOpen(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "URL copied to clipboard.",
    })
  }

  if (loading) return <div className="p-4">Loading admin data...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="access-codes">Access Codes</TabsTrigger>
          <TabsTrigger value="purchase-links">Purchase Links</TabsTrigger>
        </TabsList>

        <TabsContent value="access-codes" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Manage Access Codes</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Access Code</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Access Code</DialogTitle>
                    <DialogDescription>Fill in the details for the new access code.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="usageLimit" className="text-right">
                        Usage Limit
                      </Label>
                      <Input
                        id="usageLimit"
                        type="number"
                        value={newCodeUsageLimit}
                        onChange={(e) => setNewCodeUsageLimit(Number.parseInt(e.target.value))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="expiresAt" className="text-right">
                        Expires At
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className="col-span-3 justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newCodeExpiresAt ? format(newCodeExpiresAt, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newCodeExpiresAt}
                            onSelect={setNewCodeExpiresAt}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="isActive" className="text-right">
                        Active
                      </Label>
                      <Switch
                        id="isActive"
                        checked={newCodeIsActive}
                        onCheckedChange={setNewCodeIsActive}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="purchaseLink" className="text-right">
                        Purchase Link
                      </Label>
                      <select
                        id="purchaseLink"
                        value={newCodePurchaseLinkId || ""}
                        onChange={(e) => setNewCodePurchaseLinkId(e.target.value || null)}
                        className="col-span-3 border rounded-md p-2"
                      >
                        <option value="">None</option>
                        {purchaseLinks.map((link) => (
                          <option key={link.id} value={link.id}>
                            {link.slug} - ${link.price} {link.currency.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleCreateAccessCode}>
                      Create Code
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Purchase Link</TableHead>
                    <TableHead>Customer Info</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">{code.code}</TableCell>
                      <TableCell>
                        {code.current_usage}/{code.usage_limit}
                      </TableCell>
                      <TableCell>{code.expires_at ? format(new Date(code.expires_at), "PPP") : "Never"}</TableCell>
                      <TableCell>
                        {code.is_active ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {code.purchase_link_id
                          ? purchaseLinks.find((link) => link.id === code.purchase_link_id)?.slug || "N/A"
                          : "Free Code"}
                      </TableCell>
                      <TableCell>
                        {code.customer_name && code.customer_email ? (
                          <>
                            <p>Name: {code.customer_name}</p>
                            <p>Email: {code.customer_email}</p>
                            <p>Transaction ID: {code.transaction_id || "N/A"}</p>
                            <p>Amount Paid: ${code.amount_paid?.toFixed(2) || "N/A"}</p>
                            <p>
                              Purchase Date: {code.purchase_date ? format(new Date(code.purchase_date), "PPP") : "N/A"}
                            </p>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCode(code)
                                setEditUsageLimit(code.usage_limit)
                                setEditExpiresAt(code.expires_at ? new Date(code.expires_at) : undefined)
                                setEditIsActive(code.is_active)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Edit Access Code</DialogTitle>
                              <DialogDescription>Make changes to access code {editingCode?.code}.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="editUsageLimit" className="text-right">
                                  Usage Limit
                                </Label>
                                <Input
                                  id="editUsageLimit"
                                  type="number"
                                  value={editUsageLimit}
                                  onChange={(e) => setEditUsageLimit(Number.parseInt(e.target.value))}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="editExpiresAt" className="text-right">
                                  Expires At
                                </Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={"outline"}
                                      className="col-span-3 justify-start text-left font-normal"
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {editExpiresAt ? format(editExpiresAt, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={editExpiresAt}
                                      onSelect={setEditExpiresAt}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="editIsActive" className="text-right">
                                  Active
                                </Label>
                                <Switch
                                  id="editIsActive"
                                  checked={editIsActive}
                                  onCheckedChange={setEditIsActive}
                                  className="col-span-3"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit" onClick={handleEditAccessCode}>
                                Save changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAccessCode(code.id)}>
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-links" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Manage Purchase Links</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Purchase Link</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Purchase Link</DialogTitle>
                    <DialogDescription>Fill in the details for the new purchase link.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price" className="text-right">
                        Price
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={newLinkPrice}
                        onChange={(e) => setNewLinkPrice(Number.parseFloat(e.target.value))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="currency" className="text-right">
                        Currency
                      </Label>
                      <Input
                        id="currency"
                        value={newLinkCurrency}
                        onChange={(e) => setNewLinkCurrency(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={newLinkDescription}
                        onChange={(e) => setNewLinkDescription(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="linkIsActive" className="text-right">
                        Active
                      </Label>
                      <Switch
                        id="linkIsActive"
                        checked={newLinkIsActive}
                        onCheckedChange={setNewLinkIsActive}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleCreatePurchaseLink}>
                      Create Link
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.slug}</TableCell>
                      <TableCell>
                        ${link.price} {link.currency.toUpperCase()}
                      </TableCell>
                      <TableCell>{link.description}</TableCell>
                      <TableCell>
                        {link.is_active ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => generateQrCode(link.slug)}>
                          <QrCode className="h-4 w-4" />
                          <span className="sr-only">Generate QR</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}/buy/${link.slug}`)}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy URL</span>
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingLink(link)
                                setEditLinkPrice(link.price)
                                setEditLinkCurrency(link.currency)
                                setEditLinkDescription(link.description)
                                setEditLinkIsActive(link.is_active)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Edit Purchase Link</DialogTitle>
                              <DialogDescription>Make changes to purchase link {editingLink?.slug}.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="editLinkPrice" className="text-right">
                                  Price
                                </Label>
                                <Input
                                  id="editLinkPrice"
                                  type="number"
                                  value={editLinkPrice}
                                  onChange={(e) => setEditLinkPrice(Number.parseFloat(e.target.value))}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="editLinkCurrency" className="text-right">
                                  Currency
                                </Label>
                                <Input
                                  id="editLinkCurrency"
                                  value={editLinkCurrency}
                                  onChange={(e) => setEditLinkCurrency(e.target.value)}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="editLinkDescription" className="text-right">
                                  Description
                                </Label>
                                <Textarea
                                  id="editLinkDescription"
                                  value={editLinkDescription}
                                  onChange={(e) => setEditLinkDescription(e.target.value)}
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="editLinkIsActive" className="text-right">
                                  Active
                                </Label>
                                <Switch
                                  id="editLinkIsActive"
                                  checked={editLinkIsActive}
                                  onCheckedChange={setEditLinkIsActive}
                                  className="col-span-3"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                type="submit"
                                onClick={async () => {
                                  try {
                                    const res = await fetch("/api/admin/update-link", {
                                      method: "PUT",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
                                      },
                                      body: JSON.stringify({
                                        id: editingLink?.id,
                                        price: editLinkPrice,
                                        currency: editLinkCurrency,
                                        description: editLinkDescription,
                                        is_active: editLinkIsActive,
                                      }),
                                    })
                                    if (!res.ok) {
                                      throw new Error(`Failed to update purchase link: ${res.statusText}`)
                                    }
                                    toast({
                                      title: "Success",
                                      description: "Purchase link updated successfully!",
                                    })
                                    fetchPurchaseLinks()
                                    setEditingLink(null) // Close dialog
                                  } catch (err: any) {
                                    toast({
                                      title: "Error",
                                      description: err.message,
                                      variant: "destructive",
                                    })
                                  }
                                }}
                              >
                                Save changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" onClick={() => handleDeletePurchaseLink(link.id)}>
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isQrCodeDialogOpen} onOpenChange={setIsQrCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code for Purchase Link</DialogTitle>
            <DialogDescription>Scan this QR code to access the purchase page.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {qrCodeUrl && <QRCode value={qrCodeUrl} size={256} level="H" />}
          </div>
          <div className="text-center text-sm text-muted-foreground">{qrCodeUrl}</div>
          <DialogFooter>
            <Button onClick={() => copyToClipboard(qrCodeUrl)}>Copy URL</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
