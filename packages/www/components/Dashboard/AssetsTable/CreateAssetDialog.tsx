import {
  Box,
  Button,
  Flex,
  AlertDialog,
  IconButton,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogCancel,
  AlertDialogDescription,
  TextField,
  Heading,
  Text,
  Label,
} from "@livepeer/design-system";
import { useCallback, useMemo, useState } from "react";
import Spinner from "components/Dashboard/Spinner";
import { useDropzone } from "react-dropzone";
import { Cross2Icon } from "@radix-ui/react-icons";
import omit from "lodash.omit";

const activeStyle = {
  borderColor: "white",
};

const acceptStyle = {
  borderColor: "#5842c3",
};

const rejectStyle = {
  borderColor: "red",
};

type VideoFiles = {
  [key: string]: File;
};

const CreateAssetDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: ({ videoFiles }: { videoFiles: File[] }) => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);

  const [videoFiles, setVideoFiles] = useState<VideoFiles>({});
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setVideoFiles((prev) => ({
        ...prev,
        ...acceptedFiles.reduce(
          (prev, curr) => ({ ...prev, [curr.name]: curr }),
          {}
        ),
      }));
    }
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: "video/*",
    maxFiles: 20,
    onDrop,
  });

  const style = useMemo(
    () => ({
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
      ...(isDragActive ? activeStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent
        css={{ maxWidth: 450, minWidth: 350, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Upload Asset</Heading>
        </AlertDialogTitle>

        <Box
          css={{ mt: "$3" }}
          as="form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (creating || !videoFiles) {
              return;
            }
            setCreating(true);
            try {
              await onCreate({
                videoFiles: Object.keys(videoFiles).map(
                  (key) => videoFiles[key]
                ),
              });
              setVideoFiles({});
            } catch (error) {
              console.error(error);
            } finally {
              setCreating(false);
            }
          }}>
          <Box
            css={{
              mb: "$3",
              width: "100%",
            }}>
            <Box
              css={{
                width: "100%",
                cursor: "pointer",
                p: "$1",
                mb: "$0",
                height: "auto",
                border: "1px solid $colors$primary7",
                borderRadius: "$1",
              }}
              {...getRootProps({ style })}>
              <Box as="input" {...getInputProps()} />
              <Box
                as="p"
                css={{
                  width: "100%",
                  height: "100%",
                  border: "1px dotted $colors$primary7",
                  borderRadius: "$1",
                  m: 0,
                  fontSize: "$3",
                  p: "$3",
                  transition: "border .24s ease-in-out",
                  minWidth: "296px",
                  minHeight: "70px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Text>
                  Drag and drop or{" "}
                  <Box as="span" css={{ color: "$primary9", fontWeight: 700 }}>
                    browse files
                  </Box>
                </Text>
              </Box>
            </Box>
            {videoFiles &&
              Object.keys(videoFiles).map((key) => (
                <Flex key={key} align="center">
                  <IconButton
                    onClick={() => setVideoFiles((prev) => omit(prev, key))}
                    css={{ color: "$whiteA12", mr: "$1", cursor: "pointer" }}>
                    <Cross2Icon />
                  </IconButton>

                  <Text
                    as="p"
                    css={{
                      my: "$1",
                      fontSize: "$1",
                    }}>
                    {key}
                  </Text>
                </Flex>
              ))}

            {error && (
              <Box>
                <Text>{error}</Text>
              </Box>
            )}
          </Box>
          <AlertDialogDescription asChild>
            <Text
              size="3"
              variant="gray"
              css={{ mt: "$1", fontSize: "$2", mb: "$4" }}>
              Select up to 20 files at a time
            </Text>
          </AlertDialogDescription>
          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
            <AlertDialogCancel asChild>
              <Button disabled={creating} size="2" ghost>
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button
              css={{ display: "flex", ai: "center" }}
              type="submit"
              size="2"
              disabled={creating || Object.keys(videoFiles ?? {}).length === 0}
              variant="primary">
              {creating && (
                <Spinner
                  css={{
                    color: "$hiContrast",
                    width: 16,
                    height: 16,
                    mr: "$2",
                  }}
                />
              )}
              Upload
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateAssetDialog;
