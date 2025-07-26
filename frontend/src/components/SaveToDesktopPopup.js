import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const LOCALSTORAGE_KEY = 'hideSaveToDesktopPopup';

function isMobile() {
  // 简单判断移动端
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const SaveToDesktopPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isMobile() && !localStorage.getItem(LOCALSTORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleOk = () => {
    setOpen(false);
  };

  const handleDoNotNotify = () => {
    localStorage.setItem(LOCALSTORAGE_KEY, '1');
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleOk} aria-labelledby="save-to-desktop-title">
      <DialogTitle id="save-to-desktop-title">保存到桌面</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          为了更方便地访问本网站，建议您将此网站添加到手机桌面。
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleOk} color="primary" data-testid="save-popup-ok">OK</Button>
        <Button onClick={handleDoNotNotify} color="secondary" data-testid="save-popup-no-notify">不再提醒</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveToDesktopPopup; 