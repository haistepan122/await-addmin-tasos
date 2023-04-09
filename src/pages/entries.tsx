import React, { ReactNode, useEffect, useRef } from 'react'
import { useState } from 'react'
import Icon from '@mdi/react'
import { ref, child, get, update, remove } from 'firebase/database'
import { saveAs } from 'file-saver'
import { writeFile } from 'xlsx'
import { storage } from '../../firebase'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
pdfMake.vfs = pdfFonts.pdfMake.vfs
import { format, parse } from 'date-fns'
import JsCookies from 'js-cookie'

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
// import Head from 'next/head';

import { Modal, Button, Form, Carousel } from 'react-bootstrap'
import { toast, Toaster } from 'react-hot-toast'
import { database } from '../../firebase'
import menuAside from '../menuAside'
import menuNavBar from '../menuNavBar'
import BaseIcon from '../components/BaseIcon'
import NavBar from '../components/NavBar'
import NavBarItemPlain from '../components/NavBarItemPlain'
import AsideMenu from '../components/AsideMenu'
import axios from 'axios'

import { useAppDispatch, useAppSelector } from '../stores/hooks'
import Image from 'next/image'

import { useRouter } from 'next/router'
import {
  mdiForwardburger,
  mdiTextBoxSearchOutline,
  mdiBackburger,
  mdiMenu,
  mdiSquareEditOutline,
  mdiTrashCanOutline,
} from '@mdi/js'

import Table from 'react-bootstrap/Table'
import { font } from '../assets/font'

type Props = {
  children: ReactNode
}

export default function LayoutAuthenticated({ children }: Props) {
  const dispatch = useAppDispatch()

  const elementRef = useRef(null)
  const [allDateChecked, setAllDate]: any = useState(false)
  const [entries, setEntries]: any = useState({})
  const [order, setOrder]: any = useState('asc')
  const [searchedEntries, setSearchedEntries]: any = useState({})
  const [checkedItems, setCheckedItems]: any = useState([])
  const [filters, setFilterData]: any = useState({
    startDate: '',
    endDate: '',
    user: '',
    chain: '',
    city: '',
    category: '',
  })
  const [allCategories, setAllCategories]: any = useState({})
  const [showModal, setShowModal] = useState(false)
  const [allUsers, setAllUsers]: any = useState({})
  const [PdfLoader, setPdfLoader] = useState(false)

  const ITEMS_PER_PAGE = 50

  const [currentPage, setCurrentPage] = useState(1)

  let totalItems = Object.entries(searchedEntries).length
  let totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  let start = (currentPage - 1) * ITEMS_PER_PAGE
  let end = start + ITEMS_PER_PAGE
  let currentItems = Object.entries(searchedEntries).slice(start, end)
  const [resultItems, setResultItems] = useState(currentItems)

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => prevPage - 1)
    setAllDate(false)
    setCheckedItems([])
  }

  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1)
    setAllDate(false)

    setCheckedItems([])
  }
  const [showModal2, setShowModal2] = useState(false)
  const [modalId, setModalId]: any = useState('')
  const handleDelete = () => {
    deleteEntry(modalId)
    setShowModal2(false)
  }

  const getUsers = async () => {
    let dbRef = ref(database)
    get(child(dbRef, `Users/`)).then((snapshot) => {
      if (snapshot.exists()) {
        const res = snapshot.val()
        setAllUsers(res)
      }
    })
    dbRef = ref(database)
    get(child(dbRef, `Categories/`)).then((snapshot) => {
      if (snapshot.exists()) {
        const res = snapshot.val()
        setAllCategories(res)
      }
    })
  }
  const darkMode = useAppSelector((state) => state.style.darkMode)

  const [isAsideMobileExpanded, setIsAsideMobileExpanded] = useState(false)
  const [isAsideLgActive, setIsAsideLgActive] = useState(false)
  const [allImages, setAllImages]: any = useState([])

  const router = useRouter()

  useEffect(() => {
    if (JsCookies.get('admin_type') === 'admin') {
      
      if (Object.entries(resultItems).length <= 0) {
        getEntries()
        sortEntry()
        getUsers()
      }
    } else {
      router.push('/')
    }
  })

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsAsideMobileExpanded(false)
      setIsAsideLgActive(false)
    }

    router.events.on('routeChangeStart', handleRouteChangeStart)

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method:
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart)
    }
  }, [router.events, dispatch])

  const layoutAsidePadding = 'xl:pl-60'
  const changeOrder = async () => {
    if (order === 'asc') {
      setOrder('desc')
      sortEntry()
    } else {
      setOrder('asc')
      sortEntry()
    }
  }

  const sortEntry = () => {
    if (order === 'desc') {
      // sort entr in descending order
      
      // entries.sort((a:any, b:any) =>{
      //   return new Date(a.date).getTime() - new Date(b.date).getTime()
      // }).map(([key, value]: any) => {
      //   sortedEntries[key] = value
      // })

      const sortedEntries: any = Object.entries(searchedEntries)
        .sort((a: any, b: any) => {
          return new Date(a[1].date).getTime() - new Date(b[1].date).getTime()
        })
        
        console.log("sorted", sortedEntries)
        // .map(([key, value]: any) => {
        //   sortedEntries[key] = value
        // })
        currentItems = sortedEntries
        setResultItems(currentItems)
      console.log(sortedEntries)
    } else {
      // sort entr  on the base of date
      const sortedEntries: any = Object.entries(searchedEntries)
        .sort((a: any, b: any) => {
          return new Date(b[1].date).getTime() - new Date(a[1].date).getTime()
        })
        currentItems = sortedEntries
        setResultItems(currentItems)

      console.log("resort",sortedEntries)
    }
  }

  const getEntries = async () => {
    const dbRef = ref(database)

    get(child(dbRef, `Entries/`)).then((snapshot) => {
      if (snapshot.exists()) {
        const res = snapshot.val()

        const arr: any = []
        Object.entries(res).map(([key, value]: any) => {
          arr.push(value)
        })

        arr.reverse()

        setEntries(arr)
        setSearchedEntries(arr)
    
        
      }
    })

    totalItems = Object.entries(searchedEntries).length
    totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

    start = (currentPage - 1) * ITEMS_PER_PAGE
    end = start + ITEMS_PER_PAGE
    currentItems = Object.entries(searchedEntries).slice(start, end)
  }
  const handleDownloadPDF = async () => {
    // set loader
    setPdfLoader(true)
    // gets the checked records
    const DataForPdf = []
    Object.entries(searchedEntries).length > 0 &&
      Object.entries(searchedEntries).map(([key, value]: any) => {
        if (checkedItems.includes(value.id)) {
          DataForPdf.push(value)
        }
      })

    // do nothing if user hav't selected any record
    if (DataForPdf.length === 0) {
      setPdfLoader(false)
      return
    }

    const doc = new jsPDF()
    

    doc.addFileToVFS('Arialbd.ttf', font)
    doc.addFont('Arialbd.ttf', 'Arialbd', 'normal')
    doc.setFont('Arialbd')
    let iterationNumber = 0
    for (const item of DataForPdf) {
      const backgroundColor = '#E6E7E9'
      // Define the logo dimensions
      const logoWidth = 40
      const logoHeight = 20
      // Define the background color height
      const backgroundColorHeight = 30
      // Set the font size
      doc.setFontSize(12)
      // Set the background color
      doc.setFillColor(backgroundColor)
      // Set the position and size of the background color
      doc.rect(0, 0, doc.internal.pageSize.width, backgroundColorHeight, 'F')
      // add logo
      doc.addImage('logo_1.png', 'PNG', 5, 5, logoWidth, logoHeight)
      //  construct the header info
      const userInfo = `Date: ${item.date} User: ${item.username} | West code: ${item.store.westCode} | customer Id: ${item.userId}`
      const addressInfo = `Street: ${item.store.street} | City: ${item.store.city} | chain: ${item.store.chain}`
      const otherInfo = `The planogram is followed: ${item.question1} |  Does the refrigerator have a good image: ${item.question2}`
      let productsInfo = 'OOS Products: '
      for (let i = 0; i < item?.productsList?.length; i++) {
        const product = item.productsList[i]
        productsInfo = productsInfo + ` ${product.brandName}  ${product.category}`
      }

      // set the x and y coordinates for the header info
      const x = doc.internal.pageSize.getWidth() - 120
      const y = 5
      const lineHeight = 5
      doc.setFontSize(8)
      // add the header info to the PDF
      const difference = doc.internal.pageSize.getWidth() - x
      const useinfo = doc.splitTextToSize(userInfo, difference)
      doc.text(useinfo, x, y)
      const useinfoHeight = useinfo.length * lineHeight
      const addressinfo = doc.splitTextToSize(addressInfo, difference)
      doc.text(addressinfo, x, y + useinfoHeight)
      const addressinfoHeight = addressinfo.length * lineHeight
      const otherinfo = doc.splitTextToSize(otherInfo, difference)
      doc.text(otherinfo, x, y + useinfoHeight + addressinfoHeight)
      const otherinfoHeight = otherinfo.length * lineHeight
      const productinfo = doc.splitTextToSize(productsInfo, difference)
      doc.text(productinfo, x, y + useinfoHeight + addressinfoHeight + otherinfoHeight)

      //  define images grid params
      const imgWidth = 80
      const imgHeight = 120
      const gap = 10

      // Define margin values
      const marginTop = 35
      const marginLeft = (doc.internal.pageSize.width - (imgWidth * 2 + gap)) / 2

      // adding the image urls to fetch those images from url list 4
      const promises4 = []
      for (let i = 0; i < item?.urlListQ4?.length; i++) {
        promises4.push(getImageData(item.urlListQ4[i]))
      }

      // fetch  images from url list 4
      const base64Images4 = []
      for (const promise of promises4) {
        const base64Image = await promise
        base64Images4.push(base64Image)
      }

      // Adding the images to pdf from url list 4
      let postionprops = 0
      for (let i = 0; i < base64Images4.length; i++) {
        // Calculate x and y position based on postionprops
        const xpos = marginLeft + (postionprops % 2) * (imgWidth + gap)
        const ypos = marginTop + Math.floor(postionprops / 2) * (imgHeight + gap)

        // Add image to page
        doc.addImage(base64Images4[i], 'JPEG', xpos, ypos, imgWidth, imgHeight)
        // Add new page if four images have been added
        if ((i + 1) % 4 === 0 || postionprops === 3) {
          doc.addPage()
          postionprops = 0
        } else {
          postionprops = postionprops + 1
        }
      }

      // adding the image urls to fetch those images from url list 5
      const promises5 = []
      for (let i = 0; i < item.urlListQ5?.length; i++) {
        promises5.push(getImageData(item.urlListQ5[i]))
      }

      // fetch  images from url list 5
      const base64Images5 = []
      for (const promise of promises5) {
        const base64Image = await promise
        base64Images5.push(base64Image)
      }

      // add page if there no space left on the previous page
      if (postionprops == 3) {
        doc.addPage()
        postionprops = 0
      }

      // Adding the images to pdf from url list 5
      for (let i = 0; i < base64Images5.length; i++) {
        // Calculate x and y position based on index
        const xpos = marginLeft + (postionprops % 2) * (imgWidth + gap)
        const ypos = marginTop + Math.floor(postionprops / 2) * (imgHeight + gap)

        // Add image to page
        doc.addImage(base64Images5[i], 'JPEG', xpos, ypos, imgWidth, imgHeight)

        // Add new page if four images have been added
        if ((i + 1) % 4 === 0 || postionprops === 3) {
          doc.addPage()
          postionprops = 0
        } else {
          postionprops = postionprops + 1
        }
      }

      // Add Page if it is not the last record.
      if (iterationNumber !== DataForPdf.length - 1) {
        doc.addPage()
      }

      // add 1 to iteration number
      iterationNumber = iterationNumber + 1
    }

    doc.save('document.pdf')
    setPdfLoader(false)
  }
  const getImageData = async (imageUrl: any) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const base64Img = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          resolve(reader.result)
        }
      })
      return base64Img
    } catch (error) {
      console.error(error)
      return null
    }
  }
  async function downloadImage(url: any, filename: any) {
    const response = await axios.get(url, { responseType: 'blob' })

    saveAs(response.data, filename)
  }

  const handleImages = async () => {
    Object.entries(searchedEntries).length > 0 &&
      Object.entries(searchedEntries).map(([key, value]: any) => {
        if (checkedItems.includes(value.id)) {
          value.urlListQ4?.forEach((item: any) => {
            downloadImage(item, `${value.date}_${value.store.westCode}.jpg`)
          })
          value.urlListQ5?.forEach((item: any) => {
            downloadImage(item, `${value.date}_${value.store.westCode}.jpg`)
          })
        }
      })
  }
  function exportToExcel(tableData: any, filename: any) {
    const worksheet = XLSX.utils.json_to_sheet(tableData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    writeFile(workbook, filename)
  }
  const handleXLSX = async () => {
    const data: any = []
    Object.entries(entries).map(([key, value]: any) => {
      if (checkedItems.includes(value.id)) {
        const obj = {
          date: value.date,
          user: value.username,
          westCode: value.store.westCode,
          customer_Id: value.store.customerId,
          street: value.store.street,
          city: value.store.city,
          chain: value.store.chain,
          ηρείται_το_πλανόγραμμα: value.question1,
          χει_καλή_εικόνατο_σημείο: value.question2,
          Καταγραφή_OOS_Προϊόντων:
            value.productsList?.[0]?.brandName +
            ',' +
            value.productsList?.[1]?.brandName +
            ',' +
            value.productsList?.[2]?.brandName,
          Φωτογραφία_καταστήματος: value.urlListQ4?.[0] + ' , ' + value.urlListQ4?.[1],
          Φωτογραφία_Ψυγείου: value.urlListQ5?.[0] + ' , ' + value.urlListQ5?.[1],
        }
        data.push(obj)
      }
    })
    if (data.length > 0) {
      exportToExcel(data, 'table.xlsx')
    } else {
      toast.error('please select at least one entry')
    }
  }
  const generatePDF = async () => {
    const canvas = await html2canvas(document.querySelector('#table'))
    const imgData = canvas.toDataURL('image/png')
    const pdf: any = new jsPDF()
    pdf?.addImage(imgData)
    pdf.save('table.pdf')
  }

  const handleAllCheckItems = async (e: any) => {
    const arr: any = []
    if (e.target.checked) {
      setAllDate(true)
      currentItems.length > 0 &&
        currentItems.map(([key, value]: any) => {
          arr.push(value.id)
        })

      setCheckedItems(arr)
    } else {
      setAllDate(false)
      setCheckedItems([])
    }
  }

  const handleCheckItem = async (e: any, id: any) => {
    if (e.target.checked) {
      Object.entries(searchedEntries).length > 0 &&
        Object.entries(searchedEntries).map(([key, value]: any) => {
          if (id === value.id) {
            setCheckedItems([...checkedItems, value.id])
          }
        })
    } else {
      const arr: any = []
      checkedItems.filter((item: any) => {
        if (item !== id) {
          arr.push(item)
        }
      })
      setCheckedItems(arr)
    }
  }
  const filter = async () => {
    const filteredData = Object.entries(entries).filter((row: any) => {
      let startDate: any
      let endDate: any
      if (filters.startDate && filters.endDate) {
        startDate = format(parse(filters.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd')
        endDate = format(parse(filters.endDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd')
      }
      const date = format(parse(row[1].date, 'MM-dd-yyyy', new Date()), 'yyyy-MM-dd')

      const dateMatch = startDate && endDate ? date >= startDate && date <= endDate : true

      const userMatch = filters.user
        ? row[1]?.username?.toLowerCase().includes(filters.user.toLowerCase())
        : true

      const cityMatch = filters.city
        ? row[1]?.store?.city.toLowerCase().includes(filters.city.toLowerCase())
        : true
      const chainMatch =
        filters.chain !== null
          ? row[1]?.store?.chain.toLowerCase().includes(filters.chain.toLowerCase())
          : true
      const categoryMatch = filters.category
        ? row[1].productsList?.[0]?.category
            .toLowerCase()
            .includes(filters.category.toLowerCase()) ||
          row[1].productsList?.[1]?.category
            .toLowerCase()
            .includes(filters.category.toLowerCase()) ||
          row[1].productsList?.[2]?.category.toLowerCase().includes(filters.category.toLowerCase())
        : true

      return dateMatch && userMatch && cityMatch && chainMatch && categoryMatch
    })
    let arr: any = {}
    filteredData.map((item: any) => {
      const obj = { [item[0]]: item[1] }

      arr = { ...arr, ...obj }
    })

    setSearchedEntries(arr)
    totalItems = Object.entries(arr).length
    totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

    start = (currentPage - 1) * ITEMS_PER_PAGE
    end = start + ITEMS_PER_PAGE
    currentItems = Object.entries(arr).slice(start, end)
    setResultItems(currentItems)
  }
  const ImageGallery = (props: any) => {
    setAllImages(props)
    setShowModal(true)
  }

  const deleteEntry = async (id: any) => {
    toast.loading('Loading...')
    const dbRef = ref(database, `/Entries/${id}`)
    remove(dbRef).then(() => {
      toast.remove()
      toast.success('entry Deleted')
      getEntries()
      getUsers()
    })
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}  bg-white overflow-hidden lg:overflow-visible`}>
      
      <Toaster />
      <div
        className={`${layoutAsidePadding} ${
          isAsideMobileExpanded ? '' : ''
        } pt-14 min-h-screen w-screen transition-position lg:w-auto `}
      >
        <NavBar
          menu={menuNavBar}
          className={`${layoutAsidePadding} ${isAsideMobileExpanded ? 'bg-white ' : ''}`}
        >
          <NavBarItemPlain
            display="flex lg:hidden"
            onClick={() => setIsAsideMobileExpanded(!isAsideMobileExpanded)}
          >
            <BaseIcon path={isAsideMobileExpanded ? mdiBackburger : mdiForwardburger} size="24" />
          </NavBarItemPlain>
          <NavBarItemPlain
            display="hidden lg:flex xl:hidden"
            onClick={() => setIsAsideLgActive(true)}
          >
            <BaseIcon path={mdiMenu} size="24" />
          </NavBarItemPlain>
        </NavBar>
        <AsideMenu
          isAsideMobileExpanded={isAsideMobileExpanded}
          isAsideLgActive={isAsideLgActive}
          menu={menuAside}
          onAsideLgClose={() => setIsAsideLgActive(false)}
        />
        {children}
        <div className="m-4">
          <div></div>
          <div
            id="table"
            className="flex flex-col flex-wrap mb-4 md:flex-row gap-1 items-end justify-center md:justify-between py-4 px-2 lg:px-8"
          >
            <div className="w-full md:w-1/5 lg:w-1/6">
              <label
                className="block mb-2 font-md text-gray-700"
                style={{ color: '#28419a', fontWeight: '600' }}
              >
                Start Date
              </label>
              <input
                onChange={(e) => setFilterData({ ...filters, startDate: e.target.value })}
                className="w-full bg-gray-100 border-2 border-gray-200 p-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                type="date"
                id="start-date"
                name="start-date"
              />
            </div>
            <div className="w-full md:w-1/5 lg:w-1/6">
              <label
                className="block mb-2 font-md text-gray-700"
                style={{ color: '#28419a', fontWeight: '600' }}
              >
                End Date
              </label>
              <input
                onChange={(e) => setFilterData({ ...filters, endDate: e.target.value })}
                className="w-full bg-gray-100 border-2 border-gray-200 p-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                type="date"
                id="end-date"
                name="end-date"
              />
            </div>
            <div className="w-full md:w-1/5 lg:w-1/6">
              <label
                className="block mb-2 font-md text-gray-700"
                style={{ color: '#28419a', fontWeight: '600' }}
              >
                User
              </label>
              <select
                onChange={(e) => setFilterData({ ...filters, user: e.target.value })}
                className="w-full bg-gray-100 border-2 border-gray-200 p-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                id="user-selection"
                name="user-selection"
              >
                <option value="">Select user</option>
                {Object.entries(allUsers).length > 0 &&
                  Object.entries(allUsers).map(([key, val]: any) => {
                    return (
                      <option value={val.username} key={val.id + '123'}>
                        {val.username}
                      </option>
                    )
                  })}
              </select>
            </div>
            <div className="w-full md:w-1/5 lg:w-1/6">
              <label
                className="block mb-2  text-gray-700"
                style={{ color: '#28419a', fontWeight: '600' }}
              >
                Chain
              </label>
              <input
                onChange={(e) => setFilterData({ ...filters, chain: e.target.value })}
                className="w-full bg-gray-100 border-2 border-gray-200 p-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                type="text"
                id="chain"
                name="chain"
              />
            </div>
            <div className="w-full md:w-1/5 lg:w-1/6">
              <label
                className="block mb-2  text-gray-700"
                style={{ color: '#28419a', fontWeight: '600' }}
              >
                City
              </label>
              <input
                onChange={(e) => setFilterData({ ...filters, city: e.target.value })}
                className="w-full bg-gray-100 border-2 border-gray-200 p-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                type="text"
                id="city"
                name="city"
              />
            </div>
            <div className="w-full md:w-1/5 lg:w-1/6">
              <label
                className="block mb-2 font-md text-gray-700"
                style={{ color: '#28419a', fontWeight: '600' }}
              >
                Category
              </label>
              <select
                onChange={(e) => setFilterData({ ...filters, category: e.target.value })}
                className="w-full bg-gray-100 border-2 border-gray-200 p-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                id="user-selection"
                name="user-selection"
              >
                <option value="">Select Category</option>
                {Object.entries(allCategories).length > 0 &&
                  Object.entries(allCategories).map(([key, val]: any) => {
                    return (
                      <option value={val.category} key={val.id + '345'}>
                        {val.category}
                      </option>
                    )
                  })}
              </select>
            </div>
            <div className="w-full md:w-auto">
              <button
                onClick={filter}
                className="w-full md:w-auto  text-white font-md py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                style={{ background: '#2ec5e3', fontWeight: '600' }}
              >
                Apply Filters
              </button>
            </div>
          </div>

          <div className="flex flex-col flex-wrap mb-4 mt-2 md:flex-row gap-1 items-end justify-end md:justify-end py-4 px-2 lg:px-8">
            <div className="w-full md:w-auto">
              <button
                onClick={handleXLSX}
                className="w-full md:w-auto  text-white  py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                style={{ background: '#28419a', fontWeight: '600' }}
              >
                DOWNLOAD XLSX
              </button>
            </div>
            <div className="w-full md:w-auto">
              <button
                onClick={handleImages}
                className="w-full md:w-auto  text-white  py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                style={{ background: '#28419a', fontWeight: '600' }}
              >
                DOWNLOAD IMAGES
              </button>
            </div>
            {/* <div className="w-full md:w-auto">
    <button onClick={generatePDF} className="w-full md:w-auto  text-white  py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" style={{background:"#28419a",fontWeight:"600"}}>
      DOWNLOAD PDF
    </button>
  </div> */}
            <div className="w-full md:w-auto">
              <button
                onClick={handleDownloadPDF}
                disabled={PdfLoader === true ? true : false}
                className="w-full md:w-auto inline-flex space-x-2 items-center  text-white font-md py-2 px-4  rounded focus:outline-none focus:shadow-outline "
                type="button"
                style={{
                  fontWeight: '600',
                  background: '#28419a',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                {PdfLoader === true ? (
                  <>
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 mr-2 text-white animate-spin dark:text-gray-600 fill-blue-500"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                    <span>Processing</span>
                  </>
                ) : (
                  <span>DOWNLOAD PDF</span>
                )}
              </button>
            </div>
          </div>
          <Table striped className="border shadow-sm" responsive hover ref={elementRef}>
            <thead>
              <tr className="border shadow" style={{ fontSize: '9px', fontWeight: 'bold' }}>
                <th className="border">
                  <input
                    type="checkbox"
                    onChange={handleAllCheckItems}
                    checked={allDateChecked}
                    className="rounded shadow"
                  />
                  <label className="ml-6" onClick={changeOrder}>
                    Date
                  </label>
                </th>
                <th className="border shadow">User</th>
                <th className="border shadow">West Code</th>
                <th className="border shadow">Customer ID</th>
                <th className="border shadow">Street</th>
                <th className="border shadow">City</th>
                <th className="border shadow">Chain</th>
                <th className="border shadow">Τηρείται το πλανόγραμμα</th>
                <th className="border shadow">Έχει καλή εικόνα το ψυγείο</th>
                <th className="border shadow">Καταγραφή OOS Προϊόντων</th>
                <th className="border shadow">Φωτογραφία καταστήματος</th>
                <th className="border shadow">Φωτογραφία Ψυγείου</th>
                <th className="border shadow"></th>
              </tr>
            </thead>
            <tbody>
              {resultItems.length > 0 &&
                resultItems.map(([key, value]: any) => {
                  return (
                    <tr className="shadow " style={{ fontSize: '10px' }} key={value.id}>
                      <td className="border  ">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={checkedItems?.includes(value.id) ? true : false}
                            onChange={(e) => handleCheckItem(e, value.id)}
                            className="rounded "
                          />
                          <label className="ml-8">
                            {format(parse(value.date, 'MM-dd-yyyy', new Date()), 'dd-MM-yyyy')}
                          </label>
                        </div>
                      </td>
                      <td className="border ">{value.username}</td>
                      <td className="border ">{value.store.westCode}</td>
                      <td className="border ">{value.store.customerId}</td>
                      <td className="border ">{value.store.street}</td>
                      <td className="border ">{value.store.city}</td>
                      <td className="border ">{value.store.chain}</td>
                      <td className="border ">{value.question1}</td>
                      <td className="border ">{value.question2}</td>
                      <td className="border ">
                        {value.productsList?.[0]?.brandName
                          ? value.productsList?.[0]?.brandName + ' , '
                          : ''}{' '}
                        {value.productsList?.[1]?.brandName
                          ? value.productsList?.[1]?.brandName + ' , '
                          : ''}{' '}
                        {value.productsList?.[2]?.brandName
                          ? value.productsList?.[2]?.brandName + ' , '
                          : ''}{' '}
                        {value.productsList?.[3]?.brandName
                          ? value.productsList?.[3]?.brandName + ' , '
                          : ''}{' '}
                        {value.productsList?.[4]?.brandName
                          ? value.productsList?.[4]?.brandName + ' , '
                          : ''}{' '}
                        {value.productsList?.[5]?.brandName
                          ? value.productsList?.[5]?.brandName + ' , '
                          : ''}{' '}
                        {value.productsList?.[6]?.brandName
                          ? value.productsList?.[6]?.brandName + ' , '
                          : ''}{' '}
                      </td>
                      <td className="border ">
                        <div className="flex gap-2" onClick={() => ImageGallery(value.urlListQ4)}>
                          {value.urlListQ4?.[0] && (
                            <Image src={value.urlListQ4?.[0]} alt="img" width={20} height={10} />
                          )}
                          {value.urlListQ4?.[1] && (
                            <Image src={value.urlListQ4?.[1]} alt="img" width={20} height={10} />
                          )}
                        </div>
                      </td>
                      <td className="border ">
                        <div>
                          <div className="flex gap-2" onClick={() => ImageGallery(value.urlListQ5)}>
                            {value.urlListQ5?.[0] && (
                              <Image src={value.urlListQ5?.[0]} alt="img" width={20} height={10} />
                            )}
                            {value.urlListQ5?.[1] && (
                              <Image src={value.urlListQ5?.[1]} alt="img" width={20} height={10} />
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="flex gap-2" style={{ color: '#28419a' }}>
                          <div
                            onClick={() => {
                              setModalId(value.id)
                              setShowModal2(true)
                            }}
                          >
                            <Icon path={mdiTrashCanOutline} size={0.8} />
                          </div>

                          <div onClick={() => router.push(`/entryDetail?id=${value.id}`)}>
                            <Icon path={mdiTextBoxSearchOutline} size={0.8} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </Table>

          <div className="flex justify-end items-center">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-md py-1 px-4 rounded mr-2"
              disabled={currentPage === 1}
              onClick={handlePrevPage}
              style={{ background: '#28419a', fontWeight: '600', textTransform: 'uppercase' }}
            >
              Previous
            </button>
            <span className="text-gray-700">{`Page ${currentPage} of ${totalPages}`}</span>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-md py-1 px-4 rounded ml-2"
              disabled={currentPage === totalPages}
              onClick={handleNextPage}
              style={{ background: '#28419a', fontWeight: '600', textTransform: 'uppercase' }}
            >
              Next
            </button>
          </div>

          <Modal show={showModal} onHide={() => setShowModal(false)} dialogClassName="modal-90w">
            <Modal.Header closeButton>
              <Modal.Title>All Images</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Carousel>
                {allImages?.map((url: any) => (
                  <Carousel.Item key={url}>
                    <img
                      src={url}
                      alt="img"
                      style={{ height: '100vh', width: '100%', objectFit: 'contain' }}
                    />
                  </Carousel.Item>
                ))}
              </Carousel>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </Modal.Footer>
            <style>{`
    .modal-90w {
      max-width: 80vw;
      max-height: 50vh;
    }
    .carousel-control-prev-icon,
    .carousel-control-next-icon {
      background-color: black;
      border-radius: 10%;
      padding: 0.5rem;
    }
  `}</style>
          </Modal>
          <Modal show={showModal2} onHide={() => setShowModal2(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Delete Store</Modal.Title>
            </Modal.Header>
            <Modal.Body>Are you sure you want to delete Entry ?</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal2(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  )
}
