// Signaling that this component loves client-side interactivity right from the top
'use client'

// Importing React helpers so we can manage state and memoized slices with ease
import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from 'react' // Borrowing the usual trio for data fetching and view control plus a couple of friends for uploads
import type { GreenButtonParseResult, ParsedInterval } from '@/lib/greenbutton/parser' // Reusing the shared types so our props stay perfectly in sync
import { formatCurrency } from '@/lib/utils' // Leaning on the existing currency formatter so dollar figures stay consistent across the app

// Choosing a friendly default batch size so the table shows about a week at first glance
const DEFAULT_INTERVAL_BATCH = 168 // That is 7 days * 24 hours, which keeps the table approachable on load

// Offering a tiny helper so kWh numbers look polished everywhere they appear
const formatKwh = (value: number) => `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh` // Humanizing the numeric blob with commas and two decimals for clarity

// Wrapping the whole dashboard in a single component so the admin view can drop it in effortlessly
export function GreenButtonParserSection() {
  const [data, setData] = useState<GreenButtonParseResult | null>(null) // Holding the parsed dataset once the API call succeeds
  const [loading, setLoading] = useState(false) // Tracking whether we are still waiting for the backend to respond
  const [error, setError] = useState<string | null>(null) // Keeping any friendly error message ready for display
  const [visibleCount, setVisibleCount] = useState(DEFAULT_INTERVAL_BATCH) // Remembering how many rows the table should currently reveal
  const [uploading, setUploading] = useState(false) // Noting whether we are currently ferrying a file across the wire
  const [uploadError, setUploadError] = useState<string | null>(null) // Holding a friendly message when the upload stumbles
  const [uploadMessage, setUploadMessage] = useState<string | null>(null) // Sharing cheerful confirmation once a file arrives safely
  const [selectedFileName, setSelectedFileName] = useState('') // Showing the currently selected file name for clarity

  const loadData = useCallback(async (): Promise<boolean> => {
    setLoading(true) // Letting the interface know we are about to fetch something fresh
    setError(null) // Clearing older error messages while we try again
    let success = false // Tracking whether we managed to load new data successfully
    try {
      const response = await fetch('/api/greenbutton') // Calling the new endpoint to pick up the structured energy insights
      if (!response.ok) {
        throw new Error('Network response was not ok') // Raising a hand if the server gives us anything other than success
      }
      const payload = await response.json() // Parsing the JSON body so we can check the success flag
      if (!payload.success) {
        throw new Error(payload.error ?? 'Unknown error') // Surfacing the backend message when the success flag is false
      }
      setData(payload.data as GreenButtonParseResult) // Stashing the parsed dataset inside state for the UI to enjoy
      setError(null) // Clearing any previous error now that fresh data arrived
      setVisibleCount(DEFAULT_INTERVAL_BATCH) // Resetting pagination so the table starts at the top with the newest dataset
      success = true
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load Green Button data') // Recording the hiccup so the interface can stay honest
      setData(null) // Resetting data to avoid stale charts when an error pops up
    } finally {
      setLoading(false) // Marking the fetch cycle as complete regardless of outcome
    }
    return success
  }, [])

  const handleUpload = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault() // Keeping the page from navigating away when the form submits
    setUploadError(null) // Clearing any previous warning so we start with a clean slate
    setUploadMessage(null) // Removing any old success banner so the next one feels fresh

    const formData = new FormData(event.currentTarget) // Collecting the form fields so we can pass them along as-is
    const file = formData.get('file') // Peeking at the selected file to make sure something is waiting to upload

    if (!file || !(file instanceof File) || file.size === 0) {
      setUploadError('Please pick a Green Button XML or XLSX file before uploading.') // Coaching the user gently when no file was attached
      return
    }

    try {
      setUploading(true) // Showing a little patience indicator while we stream the file to the server
      const response = await fetch('/api/greenbutton/upload', {
        method: 'POST', // Sending the file via POST so the server knows we are delivering new data
        body: formData // Passing the form data straight through to keep the file intact
      })
      const result = await response.json() // Parsing the response so we can tell success from a polite error

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed for an unknown reason') // Surfacing the server message when the upload did not go through
      }

      setUploadMessage('Upload complete! Refreshing the latest usage insights now.') // Celebrating the win with a quick friendly note
      const refreshSuccess = await loadData() // Pulling in the latest data immediately so the dashboard updates without extra clicks
      setUploadMessage(refreshSuccess ? 'Upload complete! Latest data loaded.' : 'Upload finished, but we could not parse the new file. Please review the message below.') // Updating the note once the new data is in place
      event.currentTarget.reset() // Clearing the file picker so the user can start fresh next time
      setSelectedFileName('') // Resetting the file name indicator now that the upload is complete
    } catch (uploadProblem) {
      setUploadError(uploadProblem instanceof Error ? uploadProblem.message : 'Upload failed unexpectedly.') // Passing along the helpful message if the upload stumbles
    } finally {
      setUploading(false) // Relaxing the spinner no matter what happened so the button is ready for another try
    }
  }, [])

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] // Capturing the first (and only) selected file
    setSelectedFileName(file ? file.name : '') // Displaying the file name so the user knows selection worked
    setUploadError(null) // Clearing previous errors now that the user picked a file
    setUploadMessage(null) // Resetting the success message ready for the next upload
  }, [])

  const visibleIntervals = useMemo<ParsedInterval[]>(() => {
    if (!data) return [] // Returning an empty list while we wait for data so renders stay calm
    return data.intervals.slice(0, visibleCount) // Slicing the interval list so the table only renders the requested amount
  }, [data, visibleCount])

  const canShowMore = data ? visibleCount < data.intervals.length : false // Checking whether more rows are waiting in the wings

  if (loading) {
    return (
      <div className="card p-8 text-center text-gray-500">Loading Green Button data…</div> // Offering a gentle loading state that matches the admin styling
    )
  }

  if (error) {
    return (
      <div className="card p-8 text-center text-red-600">{error}</div> // Sharing the error in a noticeable style so admins know what happened
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Green Button Parser</h1> // Labeling the section so admins know exactly what they are looking at
        <p className="text-gray-600">Insights generated from the UtilityAPI Green Button XML export.</p> // Giving a friendly description that references the data source
      </div>

      <form onSubmit={handleUpload} className="card p-6 space-y-4" encType="multipart/form-data">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload new Green Button file</label> // Letting the team know this picker accepts fresh exports
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="greenbutton-upload-input"
              className="btn-outline border-dashed border-2 border-navy-500 text-navy-500 px-4 py-2 rounded-md hover:bg-navy-50 cursor-pointer"
            >
              Choose File
            </label>
            <span className="text-sm text-gray-600">
              {selectedFileName || 'No file chosen'}
            </span>
            <button
              type="submit"
              disabled={uploading}
              className={`btn-primary ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {uploading ? 'Uploading…' : 'Upload & Parse'}
            </button>
          </div>
          <input
            id="greenbutton-upload-input"
            type="file"
            name="file"
            accept=".xml,.xlsx,.xlsm,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-gray-500 mt-2">Supported formats: XML feeds or the ZIP-exported XLSX direct download.</p> // Adding a quick reminder about the file types the parser understands
        </div>
        {uploadMessage && <span className="text-sm text-green-600 block">{uploadMessage}</span>} // Sharing a warm success blurb when the file arrives safely
        {uploadError && <span className="text-sm text-red-600 block">{uploadError}</span>} // Flagging any upload mishaps so they can be addressed quickly
      </form>

      {error && !loading && (
        <div className="card p-6 border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {!loading && !data && !error && (
        <div className="card p-6 text-gray-600">
          Upload a Green Button XML or XLSX file to generate usage insights.
        </div>
      )}

      {data && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="text-sm text-gray-500">Total Usage</div> // Naming the metric so the number below has context
              <div className="text-2xl font-semibold text-navy-500 mt-2">{formatKwh(data.totals.totalUsageKwh)}</div> // Displaying the total usage with a polished formatter
            </div>
            <div className="card p-6">
              <div className="text-sm text-gray-500">Total Cost</div> // Labeling the second metric for clarity
              <div className="text-2xl font-semibold text-navy-500 mt-2">{formatCurrency(data.totals.totalCostDollars)}</div> // Showing the total cost using the shared currency helper
            </div>
            <div className="card p-6">
              <div className="text-sm text-gray-500">Average Cost per kWh</div> // Introducing the blended rate metric
              <div className="text-2xl font-semibold text-navy-500 mt-2">{formatCurrency(data.totals.averageCostPerKwh)}</div> // Presenting the average cost using the same formatter for consistency
            </div>
            <div className="card p-6">
              <div className="text-sm text-gray-500">Date Range</div> // Labeling the time span card
              <div className="text-2xl font-semibold text-navy-500 mt-2">{new Date(data.totals.dateRange.startIso).toLocaleDateString()} - {new Date(data.totals.dateRange.endIso).toLocaleDateString()}</div> // Showing the start and end dates in the visitor’s locale
              <div className="text-xs text-gray-500 mt-1">Covers approximately {data.totals.dateRange.daySpan.toFixed(1)} days</div> // Giving a small note about the span so gaps are easy to spot
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">Reading Type</h2> // Headline announcing the reading type details
              <ul className="space-y-2 text-sm text-gray-600">
                <li><strong>Title:</strong> {data.readingType?.title ?? 'Unknown'}</li> // Sharing the reading type title straight from the parser
                <li><strong>Unit:</strong> {data.readingType?.unitLabel ?? data.readingType?.unitCode ?? 'Unknown'}</li> // Displaying the friendly unit label or falling back to the raw code
                <li><strong>Power of Ten:</strong> {data.readingType?.powerOfTenMultiplier ?? 0}</li> // Passing along the exponent so folks understand the scaling applied
                <li><strong>Accumulation Behaviour:</strong> {data.readingType?.accumulationBehaviour ?? 'Unspecified'}</li> // Letting interested readers know how the meter reports values
                <li><strong>Usage Point ID:</strong> {data.usagePoint?.id ?? 'Unknown'}</li> // Showing the usage point identifier for cross-reference value
              </ul>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold text-navy-500 mb-4">Time-of-Use Summary</h2> // Highlighting that the table will show TOU buckets
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="pb-2">Label</th> // Naming the label column
                    <th className="pb-2">Intervals</th> // Naming the interval count column
                    <th className="pb-2">Usage</th> // Naming the usage column
                    <th className="pb-2">Cost</th> // Naming the cost column
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {data.touSummary.map(bucket => (
                    <tr key={bucket.touCode} className="border-t border-gray-200">
                      <td className="py-2">{bucket.touLabel}</td> // Listing the friendly label for the TOU bucket
                      <td className="py-2">{bucket.intervalCount.toLocaleString()}</td> // Showing how many intervals matched the bucket
                      <td className="py-2">{formatKwh(bucket.totalUsageKwh)}</td> // Presenting the usage total using the helper
                      <td className="py-2">{formatCurrency(bucket.totalCostDollars)}</td> // Presenting the cost total with the currency helper
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-navy-500">Interval Readings</h2> // Naming the detailed table section so folks know what’s below
              <div className="text-sm text-gray-600">Showing {visibleIntervals.length.toLocaleString()} of {data.intervals.length.toLocaleString()} intervals</div> // Summarizing how many rows are currently visible
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-2 text-left">Start</th> // Labeling the start time column
                    <th className="px-4 py-2 text-left">End</th> // Labeling the end time column
                    <th className="px-4 py-2 text-right">Usage</th> // Labeling the usage column
                    <th className="px-4 py-2 text-right">Cost</th> // Labeling the cost column
                    <th className="px-4 py-2 text-left">TOU</th> // Labeling the TOU column
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visibleIntervals.map((interval) => (
                    <tr key={`${interval.startIso}-${interval.touCode ?? 'na'}`} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-700">{new Date(interval.startIso).toLocaleString()}</td> // Showing the start timestamp in a local-friendly format
                      <td className="px-4 py-2 text-gray-700">{new Date(interval.endIso).toLocaleString()}</td> // Showing the end timestamp in local time too
                      <td className="px-4 py-2 text-right text-gray-900">{formatKwh(interval.valueKwh)}</td> // Displaying the usage with the helper so decimals line up
                      <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(interval.costDollars)}</td> // Displaying the cost using the shared currency formatter
                      <td className="px-4 py-2 text-gray-700">{interval.touLabel ?? 'N/A'}</td> // Showing the TOU label or a fallback if none existed
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {canShowMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setVisibleCount(prev => data ? Math.min(prev + DEFAULT_INTERVAL_BATCH, data.intervals.length) : prev)}
                  className="btn-outline border-navy-500 text-navy-500"
                >
                  Show more intervals // Inviting the user to load another batch of rows
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}


