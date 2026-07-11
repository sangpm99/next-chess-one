'use client'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

type ConfirmationDialogProps = {
  isDialogVisible: boolean
  setDialogVisible: (open: boolean) => void
  confirmationQuestion: string
  confirm: (value: boolean) => void
  width?: number
}

const ConfirmationDialog = ({
  isDialogVisible,
  setDialogVisible,
  confirmationQuestion,
  confirm,
  width
}: ConfirmationDialogProps) => {
  const onConfirmation = (value: boolean) => {
    confirm(value)
    setDialogVisible(false)
  }

  return (
    <>
      <Dialog
        fullWidth={!width}
        open={isDialogVisible}
        onClose={() => setDialogVisible(false)}
        closeAfterTransition={false}
      >
        <DialogContent className='flex items-center flex-col text-center sm:pbs-8 sm:pbe-6 sm:pli-8'>
          <i className='ri-error-warning-line text-[50px] mbe-6 text-warning' />
          <div className='flex flex-col items-center gap-2'>
            <Typography variant='h5'>{confirmationQuestion}</Typography>
          </div>
        </DialogContent>

        <DialogActions className='justify-center pbs-0 sm:pbe-8 sm:pli-8'>
          <Button variant='contained' onClick={() => onConfirmation(true)}>
            Xác nhận
          </Button>

          <Button
            variant='outlined'
            color='secondary'
            onClick={() => {
              onConfirmation(false)
            }}
          >
            Hủy
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ConfirmationDialog
